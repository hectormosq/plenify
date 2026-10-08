import { plenifyService } from "@/app/services";
import { DateParseFormat, isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { RowState, computeDraftKey, loadDraft, saveDraft, clearDraft } from "../model/uploadDraft";
import { FileSignature } from "../model/fileSignature";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";
import CategorySelector from "@/app/components/categories/CategorySelector";
import ReviewQueueSidebar, { RowSummary } from "./ReviewQueueSidebar";
import {
  Accordion,
  AccordionDetails,
  Alert,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EditIcon from "@mui/icons-material/Edit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
  maxLength: number;
  fileName: string;
  fileSignature: FileSignature;
};

const emptyRowState: RowState = { skip: false, tags: [], notes: "" };

export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const router = useRouter();
  const { categories } = usePlenifyState();
  const { fileRows, formValues, maxLength, fileName, fileSignature } = props;

  const [snackState, setSnackState] = useState({
    state: false,
    message: "",
  });

  const draftKey = useMemo(
    () => computeDraftKey(fileSignature, fileRows),
    [fileSignature, fileRows]
  );

  const totalRows = fileRows.length - (formValues.selectedRow as number);

  const [initialized, setInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [rowForm, setRowForm] = useState<RowState>(emptyRowState);
  const [account, setAccount] = useState(formValues.account);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const draftCreatedAtRef = useRef<number>(Date.now());
  const appliedAccountRef = useRef(formValues.account);

  // The account name can be fixed here if it was left blank (or wrong) back in step 1,
  // without losing review progress.
  const effectiveFormValues = useMemo(
    () => ({ ...formValues, account }),
    [formValues, account]
  );

  // Load a previously paused review for this exact file, or start a fresh one.
  useEffect(() => {
    const existing = loadDraft(draftKey);
    if (existing) {
      if (existing.currentIndex >= totalRows) {
        clearDraft(draftKey);
        router.push("/overview");
        return;
      }
      draftCreatedAtRef.current = existing.createdAt;
      setCurrentIndex(existing.currentIndex);
      setRowStates(existing.rowStates);
    } else {
      draftCreatedAtRef.current = Date.now();
      saveDraft({
        draftKey,
        label: fileSignature.label,
        createdAt: draftCreatedAtRef.current,
        fileName,
        rows: fileRows,
        maxLength,
        formValues,
        currentIndex: 0,
        rowStates: {},
      });
    }
    setInitialized(true);
    // Only re-run if we're looking at a different file/draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Cheap - pure parsing, safe to recompute on every keystroke (e.g. editing Account).
  const proccessedRow = useMemo(() => {
    const fileRowIndex = (formValues.selectedRow as number) + currentIndex;
    const row = fileRows[fileRowIndex];
    if (!row) return null;
    return { fileRowIndex, row: _proccessRow(row, effectiveFormValues) };
  }, [fileRows, formValues, effectiveFormValues, currentIndex]);

  // Expensive (a TinyBase query scanning the transactions table) - account is never part
  // of the match criteria (getTransactionByProps only matches on amount/transactionType/
  // date, see plenify.ts's _executeWhere), so this must depend on formValues, NOT
  // effectiveFormValues/account, or every keystroke while editing Account would re-run a
  // duplicate-detection scan for no reason - this was the account-typing freeze.
  const possibleMatches = useMemo(() => {
    const fileRowIndex = (formValues.selectedRow as number) + currentIndex;
    const row = fileRows[fileRowIndex];
    if (!row) return [];
    return plenifyService.getTransactionByProps(_proccessRow(row, formValues)).ALL;
  }, [fileRows, formValues, currentIndex]);

  // The transaction this import already created for the current row, if any (as opposed
  // to a pre-existing one linked via "This is the same transaction").
  const createdId = rowStates[currentIndex]?.linked
    ? undefined
    : rowStates[currentIndex]?.transactionId;

  // A row saved earlier in this import would otherwise list its own record as a
  // "possible match" (same amount/date), showing the categories it was saved with.
  const currentItem = useMemo(
    () =>
      proccessedRow
        ? {
            fileRowIndex: proccessedRow.fileRowIndex,
            proccessedRow: proccessedRow.row,
            transactions: createdId
              ? possibleMatches.filter((t) => t.id !== createdId)
              : possibleMatches,
          }
        : null,
    [proccessedRow, possibleMatches, createdId]
  );

  // Seed the on-screen form when the current row changes: restore a previous decision,
  // or default to skipping when possible duplicates already exist.
  useEffect(() => {
    if (!currentItem) return;
    const existing = rowStates[currentIndex];
    setRowForm(
      existing ?? {
        skip: currentItem.transactions.length > 0,
        tags: [],
        notes: "",
      }
    );
  }, [currentIndex, currentItem, rowStates]);

  function updateRowForm(patch: Partial<RowState>) {
    setRowForm((prev) => ({ ...prev, ...patch }));
  }

  // "This is the same transaction" on a possible match: loads that record's category/
  // notes into the current row and links its id, so Save & Next updates it (with the
  // freshly-parsed date/amount) instead of creating a duplicate. Lets a wrong/outdated
  // category or note on the old entry get corrected in the same step as confirming it.
  // Clicking it again on the confirmed match unlinks it, so the row goes back to its own
  // record (or a new one) and keeps the edited categories/notes.
  function confirmMatch(match: Transaction) {
    if (rowForm.linked && rowForm.transactionId === match.id) {
      updateRowForm({ linked: false, transactionId: createdId });
      return;
    }
    updateRowForm({
      skip: false,
      tags: match.tags ?? [],
      notes: match.notes ?? "",
      transactionId: match.id,
      linked: true,
    });
  }

  function saveCurrentAndAdvance() {
    if (!currentItem) return;

    const linkedId = rowForm.linked ? rowForm.transactionId : undefined;
    let transactionId: string | undefined;

    try {
      if (rowForm.skip) {
        // Only remove what this import created - a linked transaction existed before
        // the import, so skipping just leaves it untouched.
        if (createdId) plenifyService.deleteTransaction(createdId);
      } else if (linkedId) {
        plenifyService.updateTransaction({
          ...currentItem.proccessedRow,
          tags: rowForm.tags,
          notes: rowForm.notes,
          id: linkedId,
        });
        // The row was saved as a new transaction before being linked to an existing
        // one - drop that copy, or the import leaves a duplicate behind.
        if (createdId && createdId !== linkedId) plenifyService.deleteTransaction(createdId);
        transactionId = linkedId;
      } else {
        const payload: Transaction = {
          ...currentItem.proccessedRow,
          tags: rowForm.tags,
          notes: rowForm.notes,
          ...(createdId ? { id: createdId } : {}),
        };
        const result = createdId
          ? plenifyService.updateTransaction(payload)
          : plenifyService.addTransaction(payload);
        transactionId = createdId ?? Object.keys(result)[0];
      }
    } catch (e) {
      console.error(e);
      setSnackState({ state: true, message: "Error saving transaction" });
      return;
    }

    const nextRowStates = {
      ...rowStates,
      [currentIndex]: { ...rowForm, transactionId, linked: !!linkedId && !rowForm.skip },
    };
    setRowStates(nextRowStates);

    if (currentIndex + 1 >= totalRows) {
      clearDraft(draftKey);
      router.push("/overview");
    } else {
      saveDraft({
        draftKey,
        label: fileSignature.label,
        createdAt: draftCreatedAtRef.current,
        fileName,
        rows: fileRows,
        maxLength,
        formValues: effectiveFormValues,
        currentIndex: currentIndex + 1,
        rowStates: nextRowStates,
      });
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goPrevious() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  // Stable identity so ReviewQueueSidebar (memoized) doesn't re-render on every
  // keystroke elsewhere in this component (e.g. editing the Account field).
  const jumpToRow = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalRows) setCurrentIndex(index);
    },
    [totalRows]
  );

  // Cheap summary for every row, for the sidebar list - only _proccessRow (pure parsing,
  // no I/O). Deliberately does NOT call getTransactionByProps here: that TinyBase query
  // is what made the old all-rows-at-once review freeze the tab, and it stays scoped to
  // only the single currently-open row (see currentItem below), same as before.
  // Uses formValues (stable), NOT effectiveFormValues (re-identified on every keystroke
  // in the Account field) - RowSummary never shows the account, so re-parsing all rows
  // on every character typed would just be wasted work that froze the page.
  const rowSummaries: RowSummary[] = useMemo(() => {
    const selectedRow = formValues.selectedRow as number;
    const summaries: RowSummary[] = [];
    for (let fileRowIndex = selectedRow; fileRowIndex < fileRows.length; fileRowIndex++) {
      const row = fileRows[fileRowIndex];
      if (!row) continue;
      const processed = _proccessRow(row, formValues);
      const index = fileRowIndex - selectedRow;
      summaries.push({
        index,
        description: processed.description,
        amount: processed.amount,
        transactionType: processed.transactionType,
        date: processed.date,
        tags: rowStates[index]?.tags ?? [],
      });
    }
    return summaries;
  }, [fileRows, formValues, rowStates]);

  function cancelImport() {
    clearDraft(draftKey);
    router.push("/overview");
  }

  // Fixes an account name that was left blank/wrong back in step 1: applies the
  // corrected value to every transaction already saved in this review session.
  function handleAccountBlur() {
    if (account === appliedAccountRef.current) return;
    appliedAccountRef.current = account;

    let updatedCount = 0;
    Object.entries(rowStates).forEach(([indexStr, state]) => {
      if (!state.transactionId) return;
      const fileRowIndex = (formValues.selectedRow as number) + Number(indexStr);
      const row = fileRows[fileRowIndex];
      if (!row) return;
      const proccessedRow = _proccessRow(row, effectiveFormValues);
      plenifyService.updateTransaction({
        ...proccessedRow,
        tags: state.tags,
        notes: state.notes,
        id: state.transactionId,
      });
      updatedCount += 1;
    });

    saveDraft({
      draftKey,
      label: fileSignature.label,
      createdAt: draftCreatedAtRef.current,
      fileName,
      rows: fileRows,
      maxLength,
      formValues: effectiveFormValues,
      currentIndex,
      rowStates,
    });

    if (updatedCount > 0) {
      setSnackState({
        state: true,
        message: `Updated account for ${updatedCount} already-saved transaction${updatedCount === 1 ? "" : "s"}`,
      });
    }
  }

  // Called as a plain function (not mounted as <TransactionRowItem />): defining a
  // component inside the parent gives it a new identity every render, which remounts
  // the card and steals focus from the notes input on each keystroke.
  function renderTransactionRow({
    transaction,
    actions = false,
    rowForm,
    onTagsChange,
    onNotesChange,
    onSkipChange,
    onConfirmMatch,
    isLinkedMatch,
  }: {
    transaction: Transaction;
    actions?: boolean;
    rowForm?: RowState;
    onTagsChange?: (tags: string[]) => void;
    onNotesChange?: (notes: string) => void;
    onSkipChange?: (skip: boolean) => void;
    onConfirmMatch?: () => void;
    isLinkedMatch?: boolean;
  }) {
    const isSkipped = !!rowForm?.skip;

    return (
      <Card
        variant="outlined"
        className={classes.transactionCard}
      >
        <CardContent>
          {/* Header: TransactionType | Account | Skip */}
          <div className={classes.cardHeader}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" className={classes.mutedText}>
                {transaction?.account}
              </Typography>
              {onConfirmMatch && (
                <Chip
                  size="small"
                  label="Possible Match"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>

            {onConfirmMatch && (
              <Button
                size="small"
                variant={isLinkedMatch ? "contained" : "outlined"}
                color="warning"
                onClick={onConfirmMatch}
              >
                {isLinkedMatch ? "Linked (click to unlink)" : "This is the same transaction"}
              </Button>
            )}

            {actions && (
              <div className={classes.skipContainer}>
                <Typography variant="body2" sx={{ mr: 1, color: 'var(--foreground)' }}>
                  Skip?
                </Typography>
                <Checkbox
                  checked={isSkipped}
                  onChange={(e) => onSkipChange?.(e.target.checked)}
                />
              </div>
            )}
          </div>

          {/* Body: Description/Notes | Categories | Date | Amount */}
          <Grid container spacing={1} alignItems="flex-start">
            {/* Col 1: Description & Notes */}
            <Grid size={{ xs: 8, md: 4 }}>
              <Box sx={{ mb: 1 }}>
                <Typography className={classes.sectionTitle} variant="body1">
                  {transaction.description}
                </Typography>
              </Box>
              {actions && (
                <Collapse in={!isSkipped}>
                  <TextField
                    fullWidth
                    className={classes.themedTextField}
                    placeholder="Add notes..."
                    variant="outlined"
                    size="small"
                    value={rowForm?.notes ?? ""}
                    onChange={(e) => onNotesChange?.(e.target.value)}
                  />
                </Collapse>
              )}
            </Grid>

            {/* Col 2: Categories */}
            <Grid size={{ xs: 8, md: 4 }}>
              <Typography variant="caption" className={classes.columnTitle}>
                Categories
              </Typography>
              {actions ? (
                <Collapse in={!isSkipped}>
                  <CategorySelector
                    value={rowForm?.tags ?? []}
                    onChange={(tags) => onTagsChange?.(tags)}
                  />
                </Collapse>
              ) : (
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {transaction.tags && transaction.tags.length > 0 ? (
                    transaction.tags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={categories[tag]?.name || tag}
                        size="small"
                        sx={{
                          backgroundColor: categories[tag]?.color,
                          color: "#fff",
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" className={classes.mutedText}>-</Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* Col 3: Date */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" className={classes.columnTitle}>
                Date
              </Typography>
              {transaction.date && dayjs(transaction.date).isValid() ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={dayjs(transaction.date).format("DD/MM/YYYY")}
                  className={classes.dateChip}
                />
              ) : (
                <Chip
                  size="small"
                  variant="outlined"
                  color="error"
                  label="Invalid date"
                  title="No Date column was selected in Step 1, or this row's date value couldn't be read"
                />
              )}
            </Grid>

            {/* Col 4: Amount */}
            <Grid size={{ xs: 6, md: 2 }} display="flex" flexDirection="column" alignItems="flex-end">
              <Chip
                label={transaction?.transactionType}
                color={
                  transaction?.transactionType === TransactionType.INCOME
                    ? "success"
                    : "error"
                }
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              {transaction?.amount != null && !Number.isNaN(transaction.amount) ? (
                <Typography
                  variant="h5"
                  component="div"
                  className={transaction.transactionType === TransactionType.EXPENSE ? classes['amount--expense'] : classes['amount--income']}
                >
                  {transaction.amount.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </Typography>
              ) : (
                <Typography
                  variant="h5"
                  component="div"
                  className={classes.parseError}
                  title="No Amount column was selected in Step 1, or this row's amount value couldn't be read"
                >
                  Invalid amount
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!initialized || !currentItem) {
    return null;
  }

  const progress = totalRows > 0 ? (currentIndex / totalRows) * 100 : 100;

  return (
    <Box display="flex" gap={2} alignItems="flex-start" justifyContent="center" flexWrap="wrap" width="100%">
      <ReviewQueueSidebar
        rows={rowSummaries}
        rowStates={rowStates}
        activeIndex={currentIndex}
        onSelect={jumpToRow}
      />

      <Box className={classes.reviewContent}>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CreditCardIcon sx={{ color: "var(--maincolor)" }} />
            <Box>
              {isEditingAccount ? (
                <TextField
                  autoFocus
                  placeholder="e.g. Santander Credit Card"
                  size="small"
                  className={classes.themedTextField}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onBlur={() => {
                    handleAccountBlur();
                    setIsEditingAccount(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  title="Fixing this updates every transaction already saved in this import too"
                />
              ) : (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="subtitle1" className={classes.sectionTitle} sx={{ fontWeight: 700 }}>
                    {account || "Unlabeled account"}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Edit account"
                    onClick={() => setIsEditingAccount(true)}
                  >
                    <EditIcon fontSize="inherit" sx={{ color: "var(--inputLabel)" }} />
                  </IconButton>
                </Box>
              )}
              <Typography variant="caption" className={classes.mutedText}>
                Statement: {fileName}
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" className={classes.sectionTitle} sx={{ mt: 1.5 }}>
            Reviewing {currentIndex + 1} of {totalRows} · {progress.toFixed(1)}%
            {fileSignature.label !== "Unlabeled import" && ` — ${fileSignature.label}`}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
        </Box>

        {renderTransactionRow({
          transaction: currentItem.proccessedRow as Transaction,
          actions: true,
          rowForm,
          onTagsChange: (tags) => updateRowForm({ tags }),
          onNotesChange: (notes) => updateRowForm({ notes }),
          onSkipChange: (skip) => updateRowForm({ skip }),
        })}

        {currentItem.transactions.length > 0 && !rowForm.skip && !rowForm.linked && (
          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            Saving will add a new transaction. If one of the possible matches below is
            this same transaction, click &quot;This is the same transaction&quot; to update
            it instead (e.g. to fix its categories).
          </Alert>
        )}

        {currentItem.transactions.length > 0 && (
          // Keyed by row so it re-opens on each row - the link button is easy to miss
          // when the panel starts collapsed.
          <Accordion key={currentIndex} defaultExpanded className={classes.accordion}>
            <AccordionSummary className={classes.accordionSummary} expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
              <Typography className={classes.sectionTitle}>
                Possible Matches ({currentItem.transactions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              {currentItem.transactions.map(
                (transaction: Transaction, tIdx: number) => (
                  <Box key={tIdx} sx={{ mb: 1 }}>
                    {renderTransactionRow({
                      transaction,
                      onConfirmMatch: () => confirmMatch(transaction),
                      isLinkedMatch:
                        !!rowForm.linked &&
                        !!transaction.id &&
                        rowForm.transactionId === transaction.id,
                    })}
                  </Box>
                )
              )}
            </AccordionDetails>
          </Accordion>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" gap={1} className={classes.footerBar}>
          <Button onClick={cancelImport} color="inherit">
            Cancel import
          </Button>
          <Box display="flex" gap={1}>
            <Button onClick={goPrevious} disabled={currentIndex === 0}>
              Previous
            </Button>
            <Button variant="contained" onClick={saveCurrentAndAdvance}>
              {currentIndex + 1 >= totalRows ? "Save & Finish" : "Save & Next"}
            </Button>
          </Box>
        </Box>

        <Snackbar
          open={snackState.state}
          autoHideDuration={6000}
          onClose={() => setSnackState({ state: false, message: "" })}
          message={snackState.message}
        />
      </Box>
    </Box>
  );
}

function _proccessRow(
  row: string[],
  formValues: UploadFileConfigFormValues
): Transaction {
  const rawAmount = _getValue(formValues.amount, row);
  // parseFloat("") is NaN, unlike Number("") which is 0 - an empty/unmapped amount
  // must stay clearly invalid rather than silently becoming a real zero-amount value.
  const originalAmount =
    typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount));
  // TODO Read format date in form and use it here

  const datejs = _getDateValue(_getValue(formValues.date, row) as string, formValues.dateFormat || "DDMMYYYY");
  const normalizedProps = {
    account: _getValue(formValues.account, row) as string,
    amount: Math.abs(originalAmount),
    transactionType: _getTransactionType(
      formValues.calculatedTransactionType,
      originalAmount
    ),
    // Use dayjs's toDate() but strip time zone by constructing a new Date from formatted string
    date: dayjs(datejs.format()).toDate(),
    description: _getValue(formValues.description, row) as string,
    notes: "",
    tags: [],
  };
  return normalizedProps;
}

function _getValue(prop: unknown, row: string[]) {
  if (isFromIndex(prop)) {
    return row[prop.fromIndex];
  } else {
    return prop;
  }
}

function _getDateValue(value: string, dateFormat: DateParseFormat) {

  return dayjs(value, dateFormat);
}

function _getTransactionType(
  isCalculated: boolean,
  amount: number
): TransactionType {
  if (isCalculated) {
    return amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  }
  throw new Error("Unknown transaction type");
}

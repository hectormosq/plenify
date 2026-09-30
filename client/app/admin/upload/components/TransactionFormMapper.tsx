import { plenifyService } from "@/app/services";
import { DateParseFormat, isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { RowState, computeDraftKey, loadDraft, saveDraft, clearDraft } from "../model/uploadDraft";
import { FileSignature } from "../model/fileSignature";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";
import CategorySelector from "@/app/components/categories/CategorySelector";
import {
  Accordion,
  AccordionDetails,
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
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useMemo, useRef, useState } from "react";
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

  const currentItem = useMemo(() => {
    const fileRowIndex = (formValues.selectedRow as number) + currentIndex;
    const row = fileRows[fileRowIndex];
    if (!row) return null;
    const proccessedRow = _proccessRow(row, effectiveFormValues);
    const transactions = plenifyService.getTransactionByProps(proccessedRow).ALL;
    return { fileRowIndex, proccessedRow, transactions };
  }, [fileRows, formValues, effectiveFormValues, currentIndex]);

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

  function saveCurrentAndAdvance() {
    if (!currentItem) return;

    const existingId = rowStates[currentIndex]?.transactionId;
    let transactionId = existingId;

    try {
      if (!rowForm.skip) {
        const payload: Transaction = {
          ...currentItem.proccessedRow,
          tags: rowForm.tags,
          notes: rowForm.notes,
          ...(existingId ? { id: existingId } : {}),
        };
        const result = existingId
          ? plenifyService.updateTransaction(payload)
          : plenifyService.addTransaction(payload);
        transactionId = existingId ?? Object.keys(result)[0];
      } else if (existingId) {
        plenifyService.deleteTransaction(existingId);
        transactionId = undefined;
      }
    } catch (e) {
      console.error(e);
      setSnackState({ state: true, message: "Error saving transaction" });
      return;
    }

    const nextRowStates = {
      ...rowStates,
      [currentIndex]: { ...rowForm, transactionId },
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

  function TransactionRowItem({
    transaction,
    actions = false,
    rowForm,
    onTagsChange,
    onNotesChange,
    onSkipChange,
  }: {
    transaction: Transaction;
    actions?: boolean;
    rowForm?: RowState;
    onTagsChange?: (tags: string[]) => void;
    onNotesChange?: (notes: string) => void;
    onSkipChange?: (skip: boolean) => void;
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
              <Typography variant="body2" color="text.secondary">
                {transaction?.account}
              </Typography>
            </Box>

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
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* Col 3: Date */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" className={classes.columnTitle}>
                Date
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transaction.date
                  ? dayjs(transaction.date).format("DD/MM/YYYY")
                  : "No Date"}
              </Typography>
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
              <Typography
                variant="h5"
                component="div"
                className={transaction.transactionType === TransactionType.EXPENSE ? classes['amount--expense'] : classes['amount--income']}
              >
                {transaction?.amount?.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
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
    <>
      <Box sx={{ mb: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h6">
            Reviewing {currentIndex + 1} of {totalRows}
            {fileSignature.label !== "Unlabeled import" && ` — ${fileSignature.label}`}
          </Typography>
          <TextField
            label="Account"
            placeholder="e.g. Santander Credit Card"
            size="small"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            onBlur={handleAccountBlur}
            title="Fixing this updates every transaction already saved in this import too"
            sx={{ minWidth: 220 }}
          />
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
      </Box>

      <TransactionRowItem
        transaction={currentItem.proccessedRow as Transaction}
        actions
        rowForm={rowForm}
        onTagsChange={(tags) => updateRowForm({ tags })}
        onNotesChange={(notes) => updateRowForm({ notes })}
        onSkipChange={(skip) => updateRowForm({ skip })}
      />

      {currentItem.transactions.length > 0 && (
        <Accordion className={classes.accordion}>
          <AccordionSummary className={classes.accordionSummary} expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.sectionTitle}>
              Possible Matches ({currentItem.transactions.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {currentItem.transactions.map(
              (transaction: Transaction, tIdx: number) => (
                <Box key={tIdx} sx={{ mb: 1 }}>
                  <TransactionRowItem transaction={transaction} />
                </Box>
              )
            )}
          </AccordionDetails>
        </Accordion>
      )}

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" gap={1}>
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
    </>
  );
}

function _proccessRow(
  row: string[],
  formValues: UploadFileConfigFormValues
): Transaction {
  const originalAmount = _getValue(formValues.amount, row) as number;
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

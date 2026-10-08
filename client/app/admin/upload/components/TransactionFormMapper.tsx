import { UploadFileConfigFormValues } from "../model/UploadFile";
import { FileSignature } from "../model/fileSignature";
import { Transaction } from "@/app/models/transaction";
import classes from "./TransactionFormMapper.module.scss";
import ReviewQueueSidebar from "./ReviewQueueSidebar";
import TransactionRowCard from "./TransactionRowCard";
import { CommitResult, useUploadReview } from "../hooks/useUploadReview";
import {
  Accordion,
  AccordionDetails,
  Alert,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
  maxLength: number;
  fileName: string;
  fileSignature: FileSignature;
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const { fileName, fileSignature } = props;
  const {
    initialized,
    currentIndex,
    totalRows,
    rowStates,
    rowForm,
    currentItem,
    rowSummaries,
    account,
    setAccount,
    applyAccount,
    updateRowForm,
    confirmMatch,
    saveAndNext,
    skipAndNext,
    goPrevious,
    jumpToRow,
    finishImport,
    leaveForLater,
    discardImport,
    reviewedCount,
    createdCount,
    createdId,
    isDirty,
    snackState,
    closeSnack,
  } = useUploadReview(props);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<"finish" | "discard" | null>(null);
  const [removeCreated, setRemoveCreated] = useState(false);

  if (!initialized || !currentItem) {
    return null;
  }

  const pendingCount = totalRows - reviewedCount;
  const progress = totalRows > 0 ? (reviewedCount / totalRows) * 100 : 100;
  const hasUnlinkedMatches = currentItem.transactions.length > 0 && !rowForm.linked;

  // The import never ends by itself: once the last row is decided and nothing is
  // pending, offer to finish.
  function afterCommit(result: CommitResult) {
    if (result === "all-reviewed") setDialog("finish");
  }

  function openDialog(which: "finish" | "discard") {
    setMenuAnchor(null);
    setRemoveCreated(false);
    setDialog(which);
  }

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
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
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
                      applyAccount();
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
                  {fileSignature.label !== "Unlabeled import" && ` — ${fileSignature.label}`}
                </Typography>
              </Box>
            </Box>
            <IconButton
              aria-label="Import actions"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVertIcon sx={{ color: "var(--foreground)" }} />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => openDialog("finish")}>Finish import</MenuItem>
              <MenuItem onClick={() => openDialog("discard")} sx={{ color: "error.main" }}>
                Discard import…
              </MenuItem>
            </Menu>
          </Box>
          <Typography variant="h6" className={classes.sectionTitle} sx={{ mt: 1.5 }}>
            {reviewedCount} of {totalRows} reviewed · {progress.toFixed(1)}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
          <Typography variant="caption" className={classes.mutedText}>
            Row {currentIndex + 1} of {totalRows}
          </Typography>
        </Box>

        <TransactionRowCard
          transaction={currentItem.processedRow as Transaction}
          actions
          rowForm={rowForm}
          skipped={!!rowStates[currentIndex]?.skip}
          onTagsChange={(tags) => updateRowForm({ tags })}
          onNotesChange={(notes) => updateRowForm({ notes })}
        />

        {hasUnlinkedMatches && (
          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            Saving will add a new transaction. If one of the possible matches below is
            this same transaction, click &quot;This is the same transaction&quot; to update
            it instead (e.g. to fix its categories), or skip this row.
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
                    <TransactionRowCard
                      transaction={transaction}
                      onConfirmMatch={() => confirmMatch(transaction)}
                      isLinkedMatch={
                        !!rowForm.linked &&
                        !!transaction.id &&
                        rowForm.transactionId === transaction.id
                      }
                    />
                  </Box>
                )
              )}
            </AccordionDetails>
          </Accordion>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="flex-end" gap={1} className={classes.footerBar}>
          <Button onClick={goPrevious} disabled={currentIndex === 0}>
            Previous
          </Button>
          {/* Skipping a row this import already saved removes that transaction. */}
          <Button variant="outlined" onClick={() => afterCommit(skipAndNext())}>
            {createdId ? "Remove & skip" : "Skip"}
          </Button>
          <Button variant="contained" onClick={() => afterCommit(saveAndNext())}>
            {hasUnlinkedMatches && !createdId ? "Save as new & Next" : "Save & Next"}
          </Button>
        </Box>

        <Dialog open={dialog === "finish"} onClose={() => setDialog(null)}>
          <DialogTitle>Finish import?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {pendingCount > 0
                ? `${plural(pendingCount, "transaction")} of ${totalRows} ${pendingCount === 1 ? "has" : "have"} not been reviewed. If you finish now, ${pendingCount === 1 ? "it" : "they"} will not be imported.`
                : `All ${plural(totalRows, "transaction")} are reviewed.`}
            </DialogContentText>
            {isDirty && (
              <DialogContentText sx={{ mt: 1 }}>
                The open transaction has changes that are not saved yet.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Keep reviewing</Button>
            {pendingCount > 0 && (
              <Button onClick={leaveForLater}>Leave and resume later</Button>
            )}
            <Button variant="contained" onClick={finishImport}>
              Finish
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialog === "discard"} onClose={() => setDialog(null)}>
          <DialogTitle>Discard import?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              The saved progress for this statement will be removed.
              {createdCount > 0 &&
                ` ${plural(createdCount, "transaction")} already saved by this import ${createdCount === 1 ? "stays" : "stay"} in your data unless you remove ${createdCount === 1 ? "it" : "them"} below.`}
            </DialogContentText>
            {createdCount > 0 && (
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={removeCreated}
                    onChange={(e) => setRemoveCreated(e.target.checked)}
                  />
                }
                label={`Also remove the ${plural(createdCount, "transaction")} this import created`}
              />
            )}
            <DialogContentText variant="body2" sx={{ mt: 1 }}>
              Transactions that existed before and were linked are never removed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Keep reviewing</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setDialog(null);
                discardImport(removeCreated);
              }}
            >
              Discard
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackState.state}
          autoHideDuration={6000}
          onClose={closeSnack}
          message={snackState.message}
        />
      </Box>
    </Box>
  );
}

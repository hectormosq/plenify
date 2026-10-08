import { UploadFileConfigFormValues } from "../model/UploadFile";
import { FileSignature } from "../model/fileSignature";
import { Transaction } from "@/app/models/transaction";
import classes from "./TransactionFormMapper.module.scss";
import ReviewQueueSidebar from "./ReviewQueueSidebar";
import TransactionRowCard from "./TransactionRowCard";
import { useUploadReview } from "../hooks/useUploadReview";
import {
  Accordion,
  AccordionDetails,
  Alert,
  AccordionSummary,
  Box,
  Button,
  Divider,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
  maxLength: number;
  fileName: string;
  fileSignature: FileSignature;
};

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
    saveCurrentAndAdvance,
    goPrevious,
    jumpToRow,
    cancelImport,
    snackState,
    closeSnack,
  } = useUploadReview(props);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

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
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" className={classes.sectionTitle} sx={{ mt: 1.5 }}>
            Reviewing {currentIndex + 1} of {totalRows} · {progress.toFixed(1)}%
            {fileSignature.label !== "Unlabeled import" && ` — ${fileSignature.label}`}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
        </Box>

        <TransactionRowCard
          transaction={currentItem.processedRow as Transaction}
          actions
          rowForm={rowForm}
          onTagsChange={(tags) => updateRowForm({ tags })}
          onNotesChange={(notes) => updateRowForm({ notes })}
          onSkipChange={(skip) => updateRowForm({ skip })}
        />

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
          onClose={closeSnack}
          message={snackState.message}
        />
      </Box>
    </Box>
  );
}

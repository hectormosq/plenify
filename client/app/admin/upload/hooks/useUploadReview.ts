import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { plenifyService } from "@/app/services";
import { Transaction } from "@/app/models/transaction";
import { UploadFileConfigFormValues } from "../model/UploadFile";
import {
  DraftProgress,
  RowState,
  computeDraftKey,
  loadDraft,
  saveDraft,
  saveDraftProgress,
  clearDraft,
} from "../model/uploadDraft";
import { FileSignature } from "../model/fileSignature";
import { processRow } from "../model/processRow";
import type { RowSummary } from "../components/ReviewQueueSidebar";

export type UploadReviewParams = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
  maxLength: number;
  fileName: string;
  fileSignature: FileSignature;
};

const emptyRowState: RowState = { skip: false, tags: [], notes: "" };

export type CommitResult = "advanced" | "all-reviewed" | "failed";

function pendingIndexes(rowStates: Record<number, RowState>, totalRows: number) {
  const pending: number[] = [];
  for (let index = 0; index < totalRows; index++) {
    if (!rowStates[index]) pending.push(index);
  }
  return pending;
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

/**
 * State and persistence for the one-row-at-a-time upload review: which row is open, the
 * decision recorded for each row, the saved draft, and the writes to PlenifyService.
 */
export function useUploadReview(params: UploadReviewParams) {
  const router = useRouter();
  const { fileRows, formValues, maxLength, fileName, fileSignature } = params;

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

  const persistWarnedRef = useRef(false);

  // The transactions themselves are in PlenifyService either way; what is lost when the
  // draft can't be written is only the ability to resume. Said once, not on every row.
  function warnNotPersisted() {
    if (persistWarnedRef.current) return;
    persistWarnedRef.current = true;
    setSnackState({
      state: true,
      message:
        "Progress could not be saved in this browser. Saved transactions are kept, but this import cannot be resumed if you leave.",
    });
  }

  function persistProgress(progress: DraftProgress) {
    if (!saveDraftProgress(draftKey, progress)) warnNotPersisted();
  }

  // Load a previously paused review for this exact file, or start a fresh one.
  useEffect(() => {
    const existing = loadDraft(draftKey);
    if (existing) {
      draftCreatedAtRef.current = existing.createdAt;
      setCurrentIndex(Math.min(existing.currentIndex, Math.max(totalRows - 1, 0)));
      setRowStates(existing.rowStates);
    } else {
      draftCreatedAtRef.current = Date.now();
      const stored = saveDraft({
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
      if (!stored) warnNotPersisted();
    }
    setInitialized(true);
    // Only re-run if we're looking at a different file/draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Cheap - pure parsing, safe to recompute on every keystroke (e.g. editing Account).
  const processedRow = useMemo(() => {
    const fileRowIndex = (formValues.selectedRow as number) + currentIndex;
    const row = fileRows[fileRowIndex];
    if (!row) return null;
    return { fileRowIndex, row: processRow(row, effectiveFormValues) };
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
    return plenifyService.getTransactionByProps(processRow(row, formValues)).ALL;
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
      processedRow
        ? {
            fileRowIndex: processedRow.fileRowIndex,
            processedRow: processedRow.row,
            transactions: createdId
              ? possibleMatches.filter((t) => t.id !== createdId)
              : possibleMatches,
          }
        : null,
    [processedRow, possibleMatches, createdId]
  );

  // Seed the on-screen form when the current row changes: restore a previous decision,
  // or start empty.
  useEffect(() => {
    if (!initialized || !currentItem) return;
    const existing = rowStates[currentIndex];
    setRowForm(existing ?? emptyRowState);
    // Only when a different row opens (or the draft has just loaded). currentItem is
    // rebuilt on every keystroke in the Account field, and re-seeding then would wipe
    // the notes/categories typed on the open row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, currentIndex]);

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

  // Records the decision for the open row (save or skip), writes it to PlenifyService and
  // moves on. Returns "all-reviewed" when it was the last row and nothing is pending, so
  // the caller can offer to finish; the import never ends on its own.
  function commitRow(skip: boolean): CommitResult {
    if (!currentItem) return "failed";

    const linkedId = !skip && rowForm.linked ? rowForm.transactionId : undefined;
    let transactionId: string | undefined;

    try {
      if (skip) {
        // Only remove what this import created - a linked transaction existed before
        // the import, so skipping just leaves it untouched.
        if (createdId) plenifyService.deleteTransaction(createdId);
      } else if (linkedId) {
        plenifyService.updateTransaction({
          ...currentItem.processedRow,
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
          ...currentItem.processedRow,
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
      setSnackState({
        state: true,
        message: `Could not save this transaction: ${errorMessage(e)}`,
      });
      return "failed";
    }

    const nextRowStates = {
      ...rowStates,
      [currentIndex]: { ...rowForm, skip, transactionId, linked: !!linkedId },
    };
    setRowStates(nextRowStates);

    let nextIndex = currentIndex + 1;
    let result: CommitResult = "advanced";
    if (nextIndex >= totalRows) {
      // Last row of the file: go back to whatever was jumped over, if anything.
      const pending = pendingIndexes(nextRowStates, totalRows);
      if (pending.length === 0) {
        nextIndex = currentIndex;
        result = "all-reviewed";
      } else {
        nextIndex = pending[0];
        setSnackState({
          state: true,
          message: `${pending.length} transaction${pending.length === 1 ? "" : "s"} still pending`,
        });
      }
    }

    persistProgress({
      formValues: effectiveFormValues,
      currentIndex: nextIndex,
      rowStates: nextRowStates,
    });
    setCurrentIndex(nextIndex);
    return result;
  }

  function saveAndNext() {
    return commitRow(false);
  }

  function skipAndNext() {
    return commitRow(true);
  }

  function goPrevious() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  // Stable identity so ReviewQueueSidebar (memoized) doesn't re-render on every
  // keystroke elsewhere in the review (e.g. editing the Account field).
  const jumpToRow = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalRows) setCurrentIndex(index);
    },
    [totalRows]
  );

  // Every row parsed once per column mapping, for the sidebar list - only processRow
  // (pure parsing, no I/O). Deliberately does NOT call getTransactionByProps here: that
  // TinyBase query is what made the old all-rows-at-once review freeze the tab, and it
  // stays scoped to only the single currently-open row (see currentItem above).
  // Uses formValues (stable), NOT effectiveFormValues (re-identified on every keystroke
  // in the Account field) - RowSummary never shows the account, so re-parsing all rows
  // on every character typed would just be wasted work that froze the page.
  const parsedRows = useMemo(() => {
    const selectedRow = formValues.selectedRow as number;
    const parsed: Omit<RowSummary, "tags">[] = [];
    for (let fileRowIndex = selectedRow; fileRowIndex < fileRows.length; fileRowIndex++) {
      const row = fileRows[fileRowIndex];
      if (!row) continue;
      const processed = processRow(row, formValues);
      parsed.push({
        index: fileRowIndex - selectedRow,
        description: processed.description,
        amount: processed.amount,
        transactionType: processed.transactionType,
        date: processed.date,
      });
    }
    return parsed;
  }, [fileRows, formValues]);

  // The categories come from the decisions, which change on every save - merged here so
  // a save doesn't re-parse the whole file.
  const rowSummaries: RowSummary[] = useMemo(
    () => parsedRows.map((row) => ({ ...row, tags: rowStates[row.index]?.tags ?? [] })),
    [parsedRows, rowStates]
  );

  // Declares the statement done: the draft (and the raw rows it holds) is removed.
  // Everything saved so far is already in PlenifyService.
  function finishImport() {
    clearDraft(draftKey);
    router.push("/overview");
  }

  // Leaves the review with the draft intact, to be resumed from the upload page.
  function leaveForLater() {
    router.push("/overview");
  }

  // Throws the draft away. Optionally also removes the transactions this import
  // created; linked ones existed before the import and are never deleted.
  function discardImport(removeCreated: boolean) {
    if (removeCreated) {
      try {
        Object.values(rowStates).forEach((state) => {
          if (state.transactionId && !state.linked) {
            plenifyService.deleteTransaction(state.transactionId);
          }
        });
      } catch (e) {
        console.error(e);
        setSnackState({
          state: true,
          message: `Could not remove the imported transactions: ${errorMessage(e)}`,
        });
        return;
      }
    }
    clearDraft(draftKey);
    router.push("/overview");
  }

  // Fixes an account name that was left blank/wrong back in step 1: applies the
  // corrected value to every transaction already saved in this review session. Only
  // the account is written - a linked transaction may have been edited elsewhere since
  // it was reviewed, and the draft's copy of its categories/notes must not overwrite it.
  function applyAccount() {
    if (account === appliedAccountRef.current) return;

    let updatedCount = 0;
    try {
      Object.values(rowStates).forEach((state) => {
        if (!state.transactionId) return;
        if (plenifyService.updateTransactionAccount(state.transactionId, account)) {
          updatedCount += 1;
        }
      });
    } catch (e) {
      console.error(e);
      // appliedAccountRef is left as it was, so the next blur retries.
      setSnackState({
        state: true,
        message: `Could not update the account on saved transactions: ${errorMessage(e)}`,
      });
      return;
    }
    appliedAccountRef.current = account;

    persistProgress({ formValues: effectiveFormValues, currentIndex, rowStates });

    if (updatedCount > 0) {
      setSnackState({
        state: true,
        message: `Updated account for ${updatedCount} already-saved transaction${updatedCount === 1 ? "" : "s"}`,
      });
    }
  }

  const reviewedCount = totalRows - pendingIndexes(rowStates, totalRows).length;
  const createdCount = Object.values(rowStates).filter(
    (state) => state.transactionId && !state.linked
  ).length;

  // Whether the open row has edits that Save & Next has not written yet.
  const baseline = rowStates[currentIndex] ?? emptyRowState;
  const isDirty =
    rowForm.notes !== baseline.notes ||
    rowForm.tags.join("|") !== baseline.tags.join("|") ||
    !!rowForm.linked !== !!baseline.linked ||
    (!!rowForm.linked && rowForm.transactionId !== baseline.transactionId);

  function closeSnack() {
    setSnackState({ state: false, message: "" });
  }

  return {
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
  };
}

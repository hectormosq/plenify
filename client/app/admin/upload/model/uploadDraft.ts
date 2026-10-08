import { UploadFileConfigFormValues } from "./UploadFile";
import { FileSignature } from "./fileSignature";

export type RowState = {
  skip: boolean;
  tags: string[];
  notes: string;
  transactionId?: string;
  // true when transactionId points to a transaction that existed before this import
  // (confirmed via "This is the same transaction"), false/absent when this import created
  // it. Linked records are updated but never deleted by the review.
  linked?: boolean;
};

export type UploadDraft = {
  draftKey: string;
  label: string;
  createdAt: number;
  fileName: string;
  rows: string[][];
  maxLength: number;
  formValues: UploadFileConfigFormValues;
  currentIndex: number;
  rowStates: Record<number, RowState>;
};

export type DraftProgress = Pick<UploadDraft, "formValues" | "currentIndex" | "rowStates">;

type DraftMeta = Omit<UploadDraft, "rows">;

// A draft is stored in two parts: the statement's raw rows, written once when the import
// starts, and everything else (the progress), rewritten on every step. Re-serialising
// the rows on each Save & Next made a long import quadratic and ate the storage quota.
const META_KEY = "plenify:uploadDrafts:v2";
const ROWS_KEY_PREFIX = "plenify:uploadDraftRows:v2:";
// Drafts from the previous layout held rows and progress together. They are not
// migrated - just removed, so no raw statement is left behind under the old key.
const LEGACY_KEY = "plenify:uploadDrafts:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRowState(value: unknown): value is RowState {
  if (!isRecord(value)) return false;
  return (
    typeof value.skip === "boolean" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.notes === "string" &&
    (value.transactionId === undefined || typeof value.transactionId === "string") &&
    (value.linked === undefined || typeof value.linked === "boolean")
  );
}

/**
 * Builds a draft from what was read out of storage, or returns null if it can't be
 * trusted (written by another version of the app, truncated, edited by hand). The only
 * thing repaired rather than rejected is currentIndex, which is clamped into range.
 */
export function parseDraft(meta: unknown, rows: unknown): UploadDraft | null {
  if (!isRecord(meta)) return null;
  if (!Array.isArray(rows) || !rows.every((row) => Array.isArray(row))) return null;

  const { draftKey, label, createdAt, fileName, maxLength, formValues, currentIndex, rowStates } = meta;
  if (
    typeof draftKey !== "string" ||
    typeof label !== "string" ||
    typeof createdAt !== "number" ||
    typeof fileName !== "string" ||
    typeof maxLength !== "number" ||
    typeof currentIndex !== "number" ||
    !Number.isFinite(currentIndex) ||
    !isRecord(formValues) ||
    !isRecord(rowStates)
  ) {
    return null;
  }

  const selectedRow = formValues.selectedRow;
  if (
    typeof selectedRow !== "number" ||
    !Number.isInteger(selectedRow) ||
    selectedRow < 0 ||
    selectedRow >= rows.length
  ) {
    return null;
  }
  const totalRows = rows.length - selectedRow;

  const parsedRowStates: Record<number, RowState> = {};
  for (const [key, state] of Object.entries(rowStates)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= totalRows) return null;
    if (!isRowState(state)) return null;
    parsedRowStates[index] = state;
  }

  return {
    draftKey,
    label,
    createdAt,
    fileName,
    rows: rows as string[][],
    maxLength,
    formValues: formValues as UploadFileConfigFormValues,
    currentIndex: Math.min(Math.max(Math.trunc(currentIndex), 0), totalRows - 1),
    rowStates: parsedRowStates,
  };
}

function readAllMeta(): Record<string, unknown> {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// Returns false when the write didn't happen (private browsing, quota, etc.).
function writeAllMeta(meta: Record<string, unknown>): boolean {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

function readRows(draftKey: string): unknown {
  try {
    const raw = window.localStorage.getItem(ROWS_KEY_PREFIX + draftKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function removeRows(draftKey: string): void {
  try {
    window.localStorage.removeItem(ROWS_KEY_PREFIX + draftKey);
  } catch {
    // nothing to clean up if storage is unavailable
  }
}

/**
 * Stores a whole draft, rows included. Used once, when an import starts. Returns false
 * if it could not be stored - the review still works, it just can't be resumed.
 */
export function saveDraft(draft: UploadDraft): boolean {
  const { rows, ...meta } = draft;
  try {
    window.localStorage.setItem(ROWS_KEY_PREFIX + draft.draftKey, JSON.stringify(rows));
  } catch {
    return false;
  }
  const all = readAllMeta();
  all[draft.draftKey] = meta satisfies DraftMeta;
  if (writeAllMeta(all)) return true;
  removeRows(draft.draftKey);
  return false;
}

/**
 * Updates the progress of a draft that saveDraft already stored, without touching its
 * rows. Returns false if there is no such draft or the write failed.
 */
export function saveDraftProgress(draftKey: string, progress: DraftProgress): boolean {
  const all = readAllMeta();
  const existing = all[draftKey];
  if (!isRecord(existing)) return false;
  all[draftKey] = { ...existing, ...progress };
  return writeAllMeta(all);
}

export function loadDraft(draftKey: string): UploadDraft | null {
  const all = readAllMeta();
  if (!(draftKey in all)) return null;
  const draft = parseDraft(all[draftKey], readRows(draftKey));
  // Unreadable drafts are removed rather than left to fail again on every visit.
  if (!draft) clearDraft(draftKey);
  return draft;
}

export function listDrafts(): UploadDraft[] {
  return Object.keys(readAllMeta())
    .map((draftKey) => loadDraft(draftKey))
    .filter((draft): draft is UploadDraft => draft !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function clearDraft(draftKey: string): void {
  removeRows(draftKey);
  const all = readAllMeta();
  if (draftKey in all) {
    delete all[draftKey];
    writeAllMeta(all);
  }
}

function contentFingerprint(rows: string[][]): string {
  const text = rows.flat().join("|");
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function computeDraftKey(signature: FileSignature, rows: string[][]): string {
  if (signature.accountKey && signature.statementDate) {
    return `${signature.accountKey}:${signature.statementDate}`;
  }
  return contentFingerprint(rows);
}

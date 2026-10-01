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

const DRAFTS_KEY = "plenify:uploadDrafts:v1";

function isUploadDraft(value: unknown): value is UploadDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<UploadDraft>;
  return (
    typeof draft.draftKey === "string" &&
    Array.isArray(draft.rows) &&
    !!draft.formValues &&
    typeof draft.currentIndex === "number" &&
    !!draft.rowStates &&
    typeof draft.rowStates === "object"
  );
}

function readAllDrafts(): Record<string, UploadDraft> {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, UploadDraft> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isUploadDraft(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeAllDrafts(drafts: Record<string, UploadDraft>): void {
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) - progress just won't persist
  }
}

export function saveDraft(draft: UploadDraft): void {
  const drafts = readAllDrafts();
  drafts[draft.draftKey] = draft;
  writeAllDrafts(drafts);
}

export function loadDraft(draftKey: string): UploadDraft | null {
  const drafts = readAllDrafts();
  return drafts[draftKey] ?? null;
}

export function listDrafts(): UploadDraft[] {
  return Object.values(readAllDrafts()).sort((a, b) => b.createdAt - a.createdAt);
}

export function clearDraft(draftKey: string): void {
  const drafts = readAllDrafts();
  if (draftKey in drafts) {
    delete drafts[draftKey];
    writeAllDrafts(drafts);
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

import { RowState } from "./uploadDraft";

export type RowStatus = "active" | "saved" | "skipped" | "pending";

/**
 * A row is "saved" once it has a decision recorded (skip=false implies a transaction was
 * committed); "skipped" if explicitly marked skip; "pending" if never decided yet. The
 * currently open row always displays as "active" regardless of its underlying state.
 */
export function computeRowStatus(
  rowState: RowState | undefined,
  isActive: boolean
): RowStatus {
  if (isActive) return "active";
  if (!rowState) return "pending";
  return rowState.skip ? "skipped" : "saved";
}

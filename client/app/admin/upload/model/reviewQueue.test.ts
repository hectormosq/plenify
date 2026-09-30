import { computeRowStatus } from "./reviewQueue";
import { RowState } from "./uploadDraft";

const savedState: RowState = { skip: false, tags: [], notes: "", transactionId: "tx-1" };
const skippedState: RowState = { skip: true, tags: [], notes: "" };

describe("computeRowStatus", () => {
  it("returns pending when no decision has been recorded yet", () => {
    expect(computeRowStatus(undefined, false)).toBe("pending");
  });

  it("returns saved for a committed, non-skipped row", () => {
    expect(computeRowStatus(savedState, false)).toBe("saved");
  });

  it("returns skipped for a row explicitly marked skip", () => {
    expect(computeRowStatus(skippedState, false)).toBe("skipped");
  });

  it("returns active for the currently open row, regardless of its underlying state", () => {
    expect(computeRowStatus(undefined, true)).toBe("active");
    expect(computeRowStatus(savedState, true)).toBe("active");
    expect(computeRowStatus(skippedState, true)).toBe("active");
  });
});

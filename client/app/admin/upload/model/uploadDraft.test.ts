import {
  UploadDraft,
  saveDraft,
  loadDraft,
  listDrafts,
  clearDraft,
  computeDraftKey,
} from "./uploadDraft";
import { UploadFileConfigFormValues } from "./UploadFile";

const formValues: UploadFileConfigFormValues = {
  date: { fromIndex: 0 },
  description: { fromIndex: 1 },
  amount: { fromIndex: 2 },
  account: "Checking",
  selectedRow: 8,
  calculatedTransactionType: true,
};

function buildDraft(overrides: Partial<UploadDraft> = {}): UploadDraft {
  return {
    draftKey: "9346:30/09/2026",
    label: "••9346 — 30/09/2026",
    createdAt: Date.now(),
    fileName: "export2026930.xls",
    rows: [["29/09/2026", "La Taberna De L", "-11.5"]],
    maxLength: 3,
    formValues,
    currentIndex: 0,
    rowStates: {},
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("uploadDraft", () => {
  it("round-trips a saved draft by key", () => {
    const draft = buildDraft();
    saveDraft(draft);

    expect(loadDraft(draft.draftKey)).toEqual(draft);
  });

  it("keeps multiple drafts independent and lists them newest first", () => {
    const older = buildDraft({ draftKey: "a", createdAt: 1 });
    const newer = buildDraft({ draftKey: "b", createdAt: 2 });
    saveDraft(older);
    saveDraft(newer);

    expect(listDrafts().map((d) => d.draftKey)).toEqual(["b", "a"]);
  });

  it("clearDraft removes only the targeted key", () => {
    const a = buildDraft({ draftKey: "a" });
    const b = buildDraft({ draftKey: "b" });
    saveDraft(a);
    saveDraft(b);

    clearDraft("a");

    expect(loadDraft("a")).toBeNull();
    expect(loadDraft("b")).toEqual(b);
  });

  it("returns null/empty instead of throwing on malformed stored data", () => {
    window.localStorage.setItem("plenify:uploadDrafts:v1", "not json");
    expect(loadDraft("anything")).toBeNull();
    expect(listDrafts()).toEqual([]);

    window.localStorage.setItem(
      "plenify:uploadDrafts:v1",
      JSON.stringify({ a: { unexpected: "shape" } })
    );
    expect(loadDraft("a")).toBeNull();
    expect(listDrafts()).toEqual([]);
  });
});

describe("computeDraftKey", () => {
  it("uses account + statement date when both are known", () => {
    const key = computeDraftKey(
      { accountKey: "9346", statementDate: "30/09/2026", label: "" },
      [["irrelevant"]]
    );
    expect(key).toBe("9346:30/09/2026");
  });

  it("falls back to a content fingerprint, stable for identical rows", () => {
    const rows = [["29/09/2026", "Coffee", "-3.5"]];
    const key1 = computeDraftKey({ label: "" }, rows);
    const key2 = computeDraftKey({ label: "" }, rows);
    const key3 = computeDraftKey({ label: "" }, [["different"]]);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });
});

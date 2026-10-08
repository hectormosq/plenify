import {
  UploadDraft,
  saveDraft,
  saveDraftProgress,
  parseDraft,
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
  selectedRow: 0,
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
    window.localStorage.setItem("plenify:uploadDrafts:v2", "not json");
    expect(loadDraft("anything")).toBeNull();
    expect(listDrafts()).toEqual([]);

    window.localStorage.setItem(
      "plenify:uploadDrafts:v2",
      JSON.stringify({ a: { unexpected: "shape" } })
    );
    expect(loadDraft("a")).toBeNull();
    expect(listDrafts()).toEqual([]);
  });

  it("updates progress without rewriting the stored rows", () => {
    const draft = buildDraft();
    saveDraft(draft);
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    const rowStates = { 0: { skip: false, tags: ["a"], notes: "n", transactionId: "t1" } };
    expect(
      saveDraftProgress(draft.draftKey, { formValues, currentIndex: 0, rowStates })
    ).toBe(true);

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(String(setItem.mock.calls[0][1])).not.toContain("La Taberna De L");
    setItem.mockRestore();
    expect(loadDraft(draft.draftKey)).toEqual({ ...draft, rowStates });
  });

  it("reports when a draft or its progress cannot be stored", () => {
    const draft = buildDraft();
    expect(
      saveDraftProgress("missing", { formValues, currentIndex: 0, rowStates: {} })
    ).toBe(false);

    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveDraft(draft)).toBe(false);
    setItem.mockRestore();
    expect(loadDraft(draft.draftKey)).toBeNull();
  });

  it("removes drafts left under the old storage key", () => {
    window.localStorage.setItem("plenify:uploadDrafts:v1", JSON.stringify({ a: buildDraft() }));

    expect(listDrafts()).toEqual([]);
    expect(window.localStorage.getItem("plenify:uploadDrafts:v1")).toBeNull();
  });

  it("removes a stored draft it cannot read", () => {
    const draft = buildDraft();
    saveDraft(draft);
    const stored = JSON.parse(window.localStorage.getItem("plenify:uploadDrafts:v2")!);
    stored[draft.draftKey].rowStates = { 0: { skip: false, tags: "abc", notes: "" } };
    window.localStorage.setItem("plenify:uploadDrafts:v2", JSON.stringify(stored));

    expect(loadDraft(draft.draftKey)).toBeNull();
    expect(window.localStorage.getItem("plenify:uploadDrafts:v2")).toBe("{}");
    expect(
      window.localStorage.getItem(`plenify:uploadDraftRows:v2:${draft.draftKey}`)
    ).toBeNull();
  });
});

describe("parseDraft", () => {
  const rows = [
    ["header"],
    ["01/09/2026", "A", "-1"],
    ["02/09/2026", "B", "-2"],
  ];
  const meta = {
    draftKey: "k",
    label: "l",
    createdAt: 1,
    fileName: "f.csv",
    maxLength: 3,
    formValues: { ...formValues, selectedRow: 1 },
    currentIndex: 1,
    rowStates: { 0: { skip: true, tags: [], notes: "" } },
  };

  it("accepts a well-formed draft", () => {
    expect(parseDraft(meta, rows)).toEqual({ ...meta, rows });
  });

  it("clamps currentIndex into the range of reviewable rows", () => {
    expect(parseDraft({ ...meta, currentIndex: 99 }, rows)?.currentIndex).toBe(1);
    expect(parseDraft({ ...meta, currentIndex: -4 }, rows)?.currentIndex).toBe(0);
    expect(parseDraft({ ...meta, currentIndex: 0.7 }, rows)?.currentIndex).toBe(0);
  });

  it.each([
    ["rows that are not arrays", meta, ["x", "y"]],
    ["missing rows", meta, null],
    ["a missing starting row", { ...meta, formValues: {} }, rows],
    ["a starting row past the end of the file", { ...meta, formValues: { selectedRow: 5 } }, rows],
    ["categories that are not a list", { ...meta, rowStates: { 0: { skip: false, tags: "abc", notes: "" } } }, rows],
    ["a decision for a row that does not exist", { ...meta, rowStates: { 7: { skip: true, tags: [], notes: "" } } }, rows],
    ["a null decision", { ...meta, rowStates: { 0: null } }, rows],
    ["a non-numeric position", { ...meta, currentIndex: "2" }, rows],
  ])("rejects %s", (_name, badMeta, badRows) => {
    expect(parseDraft(badMeta, badRows)).toBeNull();
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

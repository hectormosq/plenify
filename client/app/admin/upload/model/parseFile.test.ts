import { utils, write } from "xlsx";
import { parseStatementFile } from "./parseFile";

function workbookBuffer(sheets: Record<string, unknown[][]>): ArrayBuffer {
  const workbook = utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(data), name);
  }
  return write(workbook, { type: "array", bookType: "xlsx" });
}

describe("parseStatementFile", () => {
  it("reads rows and the widest row length, dropping empty rows", () => {
    const parsed = parseStatementFile(
      workbookBuffer({
        Sheet1: [["Date", "Description", "Amount"], [], ["01/09/2026", "Shop", -10, "extra"]],
      })
    );

    expect(parsed?.rows).toEqual([
      ["Date", "Description", "Amount"],
      ["01/09/2026", "Shop", -10, "extra"],
    ]);
    expect(parsed?.maxLength).toBe(4);
  });

  it("uses the first sheet that has data, not the last", () => {
    const parsed = parseStatementFile(
      workbookBuffer({
        Empty: [],
        Movements: [["01/09/2026", "Shop", -10]],
        Summary: [["Total", -10]],
      })
    );

    expect(parsed?.rows).toEqual([["01/09/2026", "Shop", -10]]);
  });

  it("returns null when no sheet has data", () => {
    expect(parseStatementFile(workbookBuffer({ Empty: [] }))).toBeNull();
  });

  it("reads CSV text", () => {
    const text = "Date,Description,Amount\n01/09/2026,Shop,-10\n";
    const csv = Uint8Array.from(text, (char) => char.charCodeAt(0));
    const parsed = parseStatementFile(csv.buffer);

    expect(parsed?.rows).toHaveLength(2);
    expect(parsed?.rows[1][1]).toBe("Shop");
  });
});

import { read, utils } from "xlsx";

export type ParsedFile = {
  rows: string[][];
  maxLength: number;
};

/**
 * Reads a CSV/XLS/XLSX statement into rows of cells, dropping empty rows. A workbook
 * can hold several sheets; the first one with any data is used. Returns null when no
 * sheet has data.
 */
export function parseStatementFile(buffer: ArrayBuffer): ParsedFile | null {
  const workbook = read(buffer, { raw: true, cellDates: true });
  for (const sheetName of workbook.SheetNames) {
    const rawData: string[][] = utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });
    const rows = rawData.filter((row) => row.length > 0);
    if (rows.length > 0) {
      return { rows, maxLength: Math.max(...rows.map((row) => row.length)) };
    }
  }
  return null;
}

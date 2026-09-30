import { extractFileSignature } from "./fileSignature";

describe("extractFileSignature", () => {
  it("extracts the account key and statement date from a bank export header", () => {
    const rows = [
      [null, "CREDITO EJEMPLO BANK", "FECHA"],
      [null, "0000 1111 2222 3333", "30/09/2026 | 12:48:16"],
      [null, "Titular"],
      [null, "NOMBRE APELLIDO EJEMPLO"],
      [],
      ["MOVIMIENTOS"],
      [],
      ["FECHA OPERACIÓN", "CONCEPTO", "IMPORTE EUR"],
      ["29/09/2026", "Ejemplo Comercio", "-11.5"],
    ] as unknown as string[][];

    const signature = extractFileSignature(rows);

    expect(signature.accountKey).toBe("3333");
    expect(signature.statementDate).toBe("30/09/2026");
    expect(signature.label).toBe("••3333 — 30/09/2026");
  });

  it("degrades gracefully when nothing recognizable is found", () => {
    const rows = [["Description", "Amount"], ["Coffee", "-3.5"]];

    const signature = extractFileSignature(rows);

    expect(signature.accountKey).toBeUndefined();
    expect(signature.statementDate).toBeUndefined();
    expect(signature.label).toBe("Unlabeled import");
  });
});

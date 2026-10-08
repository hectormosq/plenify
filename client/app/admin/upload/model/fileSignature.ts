export type FileSignature = {
  accountKey?: string;
  statementDate?: string;
  label: string;
};

const ACCOUNT_NUMBER_PATTERN = /\d[\d\s]{10,25}\d/;
const STATEMENT_DATE_PATTERN = /\d{2}\/\d{2}\/\d{4}/;

/**
 * Best-effort extraction of an identifying account number and statement date from a
 * bank export's header rows. Bank formats vary, so this always degrades gracefully to
 * an unlabeled signature rather than throwing.
 */
export function extractFileSignature(rows: string[][]): FileSignature {
  const headerText = rows
    .flat()
    .filter((cell): cell is string => typeof cell === "string" && cell.length > 0)
    .join(" | ");

  const accountMatch = headerText.match(ACCOUNT_NUMBER_PATTERN);
  const accountKey = accountMatch
    ? accountMatch[0].replace(/\D/g, "").slice(-4)
    : undefined;

  const dateMatch = headerText.match(STATEMENT_DATE_PATTERN);
  const statementDate = dateMatch ? dateMatch[0] : undefined;

  const label =
    [accountKey ? `••${accountKey}` : null, statementDate]
      .filter(Boolean)
      .join(" — ") || "Unlabeled import";

  return { accountKey, statementDate, label };
}

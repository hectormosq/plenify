import dayjs from "dayjs";
import { Transaction, TransactionType } from "@/app/models/transaction";
import { DateParseFormat, isFromIndex, UploadFileConfigFormValues } from "./UploadFile";

export function processRow(
  row: string[],
  formValues: UploadFileConfigFormValues
): Transaction {
  const rawAmount = _getValue(formValues.amount, row);
  // parseFloat("") is NaN, unlike Number("") which is 0 - an empty/unmapped amount
  // must stay clearly invalid rather than silently becoming a real zero-amount value.
  const originalAmount =
    typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount));
  // TODO Read format date in form and use it here

  const datejs = _getDateValue(_getValue(formValues.date, row) as string, formValues.dateFormat || "DDMMYYYY");
  const normalizedProps = {
    account: _getValue(formValues.account, row) as string,
    amount: Math.abs(originalAmount),
    transactionType: _getTransactionType(
      formValues.calculatedTransactionType,
      originalAmount
    ),
    // Use dayjs's toDate() but strip time zone by constructing a new Date from formatted string
    date: dayjs(datejs.format()).toDate(),
    description: _getValue(formValues.description, row) as string,
    notes: "",
    tags: [],
  };
  return normalizedProps;
}

function _getValue(prop: unknown, row: string[]) {
  if (isFromIndex(prop)) {
    return row[prop.fromIndex];
  } else {
    return prop;
  }
}

function _getDateValue(value: string, dateFormat: DateParseFormat) {

  return dayjs(value, dateFormat);
}

function _getTransactionType(
  isCalculated: boolean,
  amount: number
): TransactionType {
  if (isCalculated) {
    return amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  }
  throw new Error("Unknown transaction type");
}

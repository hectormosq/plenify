import { plenifyService } from "@/app/services";
import { isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { TransactionType } from "@/app/models/transaction";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
};
export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const { fileRows, formValues } = props;
  for (let i = formValues.selectedRow as number; i < fileRows.length; i++) {
    const row = fileRows[i];
    const normalizedProps = _normalizeRowProps(row, formValues);
    const transactionsByType = plenifyService.getTransactionByProps(normalizedProps)
    console.log("Processing row:", i, row);
    console.log("Result:", transactionsByType);
  }
  return <>Transaction Mapper Works!</>;
}

function _normalizeRowProps(
  row: string[],
  formValues: UploadFileConfigFormValues
) {
  const originalAmount = _getValue(formValues.amount, row) as number;

  const normalizedProps: Record<string, string | number> = {
    account: _getValue(formValues.account, row) as string,
    amount: Math.abs(originalAmount),
    calculatedTransactionType: _getTransactionType(formValues.calculatedTransactionType, originalAmount),
    date: _getValue(formValues.date, row) as string,
    description: _getValue(formValues.description, row) as string,
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

function _getTransactionType(isCalculated: boolean, amount: number): string {
  if (isCalculated) {
    return amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  }
  throw new Error("Unknown transaction type");

}

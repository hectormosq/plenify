import { plenifyService } from "@/app/services";
import { isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
};
export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const { fileRows, formValues } = props;
  const dataset = [];
  for (let i = formValues.selectedRow as number; i < fileRows.length; i++) {
    const row = fileRows[i];
    const proccessedRow = _proccessRow(row, formValues);
    const transactionsByType =
      plenifyService.getTransactionByProps(proccessedRow);
    console.log("Processing row:", i, row);
    console.log("Normalized props", proccessedRow);
    console.log("Result:", transactionsByType);
    dataset.push({
      fileRow: i,
      rawRow: row,
      proccessedRow: proccessedRow,
      transactions: transactionsByType.ALL,
    });
  }
  return (
    <>
      {dataset.map((item, idx) => (
        <div key={idx} className={classes.formMapperRow}>
          <div>{_transactionRowTpl(item.proccessedRow as Transaction)}</div>
          <div>
            {item.transactions.map((transaction: Transaction, tIdx: number) => (
              <div key={tIdx}>
                {_transactionRowTpl(transaction as Transaction)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function _transactionRowTpl(transaction: Transaction) {
  return (
    <div className={classes.transactionRow}>
      <div>
        <div>Account</div>
        <div>{transaction?.account}</div>
      </div>
      <div>
        <div>Amount</div>
        <div>{transaction?.amount}</div>
      </div>
      <div>
        <div>Date</div>
        <div>{transaction.date?.toISOString()}</div>
      </div>
      <div>
        <div>Description</div>
        <div>{transaction.description}</div>
      </div>
    </div>
  );
}

function _proccessRow(
  row: string[],
  formValues: UploadFileConfigFormValues
): Transaction {
  const originalAmount = _getValue(formValues.amount, row) as number;
  // TODO Read format date in form and use it here
  const datejs = dayjs(_getValue(formValues.date, row) as string, "DD/MM/YYYY");
  const normalizedProps = {
    account: _getValue(formValues.account, row) as string,
    amount: Math.abs(originalAmount),
    transactionType: _getTransactionType(
      formValues.calculatedTransactionType,
      originalAmount
    ),
    // Use dayjs's toDate() but strip time zone by constructing a new Date from formatted string
    date: dayjs(datejs.format("YYYY-MM-DD")).toDate(),
    description: _getValue(formValues.description, row) as string,
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

function _getTransactionType(
  isCalculated: boolean,
  amount: number
): TransactionType {
  if (isCalculated) {
    return amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  }
  throw new Error("Unknown transaction type");
}

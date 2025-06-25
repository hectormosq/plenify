import { plenifyService } from "@/app/services";
import { isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import CategorySelector from "@/app/components/categories/CategorySelector";
import { Checkbox } from "@mui/material";

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
    dataset.push({
      fileRow: i,
      rawRow: row,
      proccessedRow: proccessedRow,
      transactions: transactionsByType.ALL,
      formDefault: {
        tags: [],
        skip: transactionsByType.ALL.length ? true : false,
        account: proccessedRow.account,
        amount: proccessedRow.amount,
        transactionType: proccessedRow.transactionType,
        date: proccessedRow.date,
        description: proccessedRow.description,
      },
    });
  }

  const { control, handleSubmit, register } = useForm({
    defaultValues: {
      transactionRow: dataset.map((item) => item.formDefault),
    },
  });
  const { fields } = useFieldArray({ control, name: "transactionRow" });

  function _transactionRowTpl(
    transaction: Transaction,
    index: number,
    actions = false
  ) {
    const field = fields[index];
    return (
      <div className={classes.transactionRow}>
        <div className={classes.transaction}>
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
            <div>
              {transaction.date
                ? dayjs(transaction.date).format("DD/MM/YYYY")
                : ""}
            </div>
          </div>
          <div>
            <div>Description</div>
            <div>{transaction.description}</div>
          </div>
        </div>
        {actions && (
          <div className={classes.transactionActions}>
            <input hidden {...register(`transactionRow.${index}.account`)} />
            <input hidden {...register(`transactionRow.${index}.amount`)} />
            <input
              hidden
              {...register(`transactionRow.${index}.transactionType`)}
            />
            <input hidden {...register(`transactionRow.${index}.date`)} />
            <input
              hidden
              {...register(`transactionRow.${index}.description`)}
            />

            <div>
              <label htmlFor="skip">Skip Transaction ?</label>
              <Controller
                key={field.id}
                name={`transactionRow.${index}.skip`}
                control={control}
                render={({ field }) => (
                  <Checkbox {...field} checked={field.value} />
                )}
              />
            </div>
            {/* TODO Fix display on skip false*/}
            {
              <>
                <div>
                  <label htmlFor="tags">Categories</label>
                  <Controller
                    key={field.id}
                    name={`transactionRow.${index}.tags`}
                    control={control}
                    render={({ field }) => <CategorySelector {...field} />}
                  />
                </div>
              </>
            }
          </div>
        )}
      </div>
    );
  }

  function onSubmit(data: { transactionRow: (Transaction & { skip: boolean })[] }) {
    const summary = {};
    data.transactionRow.forEach((transaction) => {
      if (!transaction.skip) {
        try {
          const result = plenifyService.addTransaction(transaction);
          Object.assign(summary, result);
        } catch (e) {
          console.error(e);
        }
      }
    });
    console.log(summary);
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>Total Transactions: {dataset.length + 1}</div>
        <button type="submit">Submit</button>
        {dataset.map((item, idx) => (
          <div key={idx} className={classes.formMapperRow}>
            <div>From File Row {item.fileRow}</div>
            <div>
              {_transactionRowTpl(item.proccessedRow as Transaction, idx, true)}
            </div>
            <div>
              {item.transactions.length > 0 && (
                <>
                  <div>Store Possible Matches</div>
                  {item.transactions.map(
                    (transaction: Transaction, tIdx: number) => (
                      <div key={tIdx}>
                        {_transactionRowTpl(transaction as Transaction, idx)}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </form>
    </>
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
    date: dayjs(datejs.format()).toDate(),
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

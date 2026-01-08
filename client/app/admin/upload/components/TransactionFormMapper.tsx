import { plenifyService } from "@/app/services";
import { DateParseFormat, isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";
import { Control, Controller, UseFormRegister, useFieldArray, useForm } from "react-hook-form";
import CategorySelector from "@/app/components/categories/CategorySelector";
import { Checkbox, Snackbar, TextField } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
  onValidityChange?: (isValid: boolean) => void;
  submitTrigger: boolean;
  onSubmissionComplete?: () => void;
};
export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const router = useRouter();
  const [snackState, setSnackState] = useState({
    state: false,
    message: "",
  });

  const { fileRows, formValues } = props;
  const dataset = useMemo(() => {
    const data = [];
    for (let i = formValues.selectedRow as number; i < fileRows.length; i++) {
      const row = fileRows[i];
      const proccessedRow = _proccessRow(row, formValues);
      const transactionsByType =
        plenifyService.getTransactionByProps(proccessedRow);
      data.push({
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
          notes: proccessedRow.notes,
        },
      });
    }
    return data;
  }, [fileRows, formValues]);


  const { control, handleSubmit, register, formState } = useForm({
    defaultValues: {
      transactionRow: dataset.map((item) => item.formDefault),
    },
    mode: "onBlur",
  });
  const { fields } = useFieldArray({ control, name: "transactionRow" });

  /*
   * Watch for submit trigger from parent
   */
  useEffect(() => {
    if (props.submitTrigger) {
      handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } finally {
          props.onSubmissionComplete?.();
        }
      })();
    }
  }, [props.submitTrigger]);

  useEffect(() => {
    props.onValidityChange?.(formState.isValid);
  }, [formState.isValid, props.onValidityChange]);

  function TransactionRowItem({
    transaction,
    index,
    actions = false,
    control,
    register,
  }: {
    transaction: Transaction;
    index: number;
    actions?: boolean;
    control: Control<any>;
    register: UseFormRegister<any>;
  }) {
    return (
      <div className={classes.transactionRow}>
        <div className={classes.transaction}>
          <div className={classes.transactionItem}>
            <div className={classes.transaction__itemTitle}>Account</div>
            <div>{transaction?.account}</div>
          </div>
          <div className={classes.transactionItem}>
            <div className={classes.transaction__itemTitle}>Amount</div>
            <div>{transaction?.amount}</div>
          </div>
          <div className={classes.transactionItem}>
            <div className={classes.transaction__itemTitle}>Type</div>
            <div>{transaction?.transactionType}</div>
          </div>
          <div className={classes.transactionItem}>
            <div className={classes.transaction__itemTitle}>Date</div>
            <div>
              {transaction.date
                ? dayjs(transaction.date).format("DD/MM/YYYY")
                : ""}
            </div>
          </div>
          <div className={classes.transactionItem}>
            <div className={classes.transaction__itemTitle}>Description</div>
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
              <label htmlFor={`transactionRow.${index}.skip`}>
                Skip Transaction ?
              </label>
              <Controller
                name={`transactionRow.${index}.skip`}
                control={control}
                render={({ field }) => (
                  <Checkbox {...field} checked={field.value} />
                )}
              />
            </div>
            {
              <>
                <div>
                  <label htmlFor={`transactionRow.${index}.tags`}>
                    Categories
                  </label>
                  <Controller
                    name={`transactionRow.${index}.tags`}
                    control={control}
                    render={({ field }) => <CategorySelector {...field} />}
                  />
                </div>
                <div>
                  <label htmlFor={`transactionRow.${index}.notes`}>Notes</label>
                  <Controller
                    name={`transactionRow.${index}.notes`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        className={classes.form__input}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    )}
                  />
                </div>
              </>
            }
          </div>
        )}
      </div>
    );
  }

  async function onSubmit(data: {
    transactionRow: (Transaction & { skip: boolean })[];
  }) {
    const summary = {};
    try {
      await Promise.all(
        data.transactionRow.map(async (transaction) => {
          if (!transaction.skip) {
            const result = await plenifyService.addTransaction(transaction);
            Object.assign(summary, result);
          }
        })
      );
      const totalAdded = Object.entries(summary).length + 1;
      setSnackState({ state: true, message: `Added ${totalAdded}` });
      // Use Next.js router for navigation

      router.push("/overview");
    } catch (e) {
      console.error(e);
      setSnackState({ state: true, message: `Error While Adding ` });
    }
  }

  return (
    <>
      <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
        <div>Total Transactions: {dataset.length + 1}</div>
        {dataset.map((item, idx) => (
          <div key={idx} className={classes.formMapperRow}>
            <div>From File Row {item.fileRow}</div>
            <div>
              <TransactionRowItem
                transaction={item.proccessedRow as Transaction}
                index={idx}
                actions={true}
                control={control}
                register={register}
              />
            </div>
            <div>
              {item.transactions.length > 0 && (
                <>
                  <div>Store Possible Matches</div>
                  {item.transactions.map(
                    (transaction: Transaction, tIdx: number) => (
                      <div key={tIdx}>
                        <TransactionRowItem
                          transaction={transaction as Transaction}
                          index={idx}
                          control={control}
                          register={register}
                        />
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </form>
      <Snackbar
        open={snackState.state}
        autoHideDuration={6000}
        onClose={() => setSnackState({ state: false, message: "" })}
        message={snackState.message}
      />
    </>
  );
}

function _proccessRow(
  row: string[],
  formValues: UploadFileConfigFormValues
): Transaction {
  const originalAmount = _getValue(formValues.amount, row) as number;
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

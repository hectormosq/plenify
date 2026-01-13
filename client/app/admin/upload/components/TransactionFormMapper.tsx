import { plenifyService } from "@/app/services";
import { DateParseFormat, isFromIndex, UploadFileConfigFormValues } from "../model/UploadFile";
import { Transaction, TransactionType } from "@/app/models/transaction";
import dayjs from "dayjs";
import classes from "./TransactionFormMapper.module.scss";
import { Control, Controller, UseFormRegister, useFieldArray, useForm, useWatch } from "react-hook-form";
import CategorySelector from "@/app/components/categories/CategorySelector";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  Snackbar,
  TextField,
  Typography,
  Box,
  Divider,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";

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
  const { categories } = usePlenifyState();
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
    const isSkipped = useWatch({
      control,
      name: `transactionRow.${index}.skip`,
    });

    return (
      <Card
        variant="outlined"
        className={classes.transactionCard}
      >
        <CardContent>
          {/* Header: TransactionType | Account | Skip */}
          <div className={classes.cardHeader}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {transaction?.account}
              </Typography>
            </Box>

            {actions && (
              <div className={classes.skipContainer}>
                <Typography variant="body2" sx={{ mr: 1, color: 'var(--foreground)' }}>
                  Skip?
                </Typography>
                <Controller
                  name={`transactionRow.${index}.skip`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox {...field} checked={field.value} />
                  )}
                />
                {/* Hidden inputs to keep form state */}
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
              </div>
            )}
          </div>

          {/* Body: Description/Notes | Categories | Date | Amount */}
          <Grid container spacing={1} alignItems="flex-start">
            {/* Col 1: Description & Notes */}
            <Grid size={{ xs: 8, md: 4 }}>
              <Box sx={{ mb: 1 }}>
                <Typography className={classes.sectionTitle} variant="body1">
                  {transaction.description}
                </Typography>
              </Box>
              {actions && (
                <Collapse in={!isSkipped}>
                  <Controller
                    name={`transactionRow.${index}.notes`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        placeholder="Add notes..."
                        variant="outlined"
                        size="small"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    )}
                  />
                </Collapse>
              )}
            </Grid>

            {/* Col 2: Categories */}
            <Grid size={{ xs: 8, md: 4 }}>
              <Typography variant="caption" className={classes.columnTitle}>
                Categories
              </Typography>
              {actions ? (
                <Collapse in={!isSkipped}>
                  <Controller
                    name={`transactionRow.${index}.tags`}
                    control={control}
                    render={({ field }) => (
                      <CategorySelector {...field} />
                    )}
                  />
                </Collapse>
              ) : (
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {transaction.tags && transaction.tags.length > 0 ? (
                    transaction.tags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={categories[tag]?.name || tag}
                        size="small"
                        sx={{
                          backgroundColor: categories[tag]?.color,
                          color: "#fff",
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* Col 3: Date */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" className={classes.columnTitle}>
                Date
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transaction.date
                  ? dayjs(transaction.date).format("DD/MM/YYYY")
                  : "No Date"}
              </Typography>
            </Grid>

            {/* Col 4: Amount */}
            <Grid size={{ xs: 6, md: 2 }} display="flex" flexDirection="column" alignItems="flex-end">
              <Chip
                label={transaction?.transactionType}
                color={
                  transaction?.transactionType === TransactionType.INCOME
                    ? "success"
                    : "error"
                }
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Typography
                variant="h5"
                component="div"
                className={transaction.transactionType === TransactionType.EXPENSE ? classes['amount--expense'] : classes['amount--income']}
              >
                {transaction?.amount?.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
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
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6">
            Total Transactions: {dataset.length}
          </Typography>
        </Box>
        <Grid container spacing={0.5} direction="column" >
          {dataset.map((item, idx) => (
            <Grid key={idx}>
              <TransactionRowItem
                transaction={item.proccessedRow as Transaction}
                index={idx}
                actions={true}
                control={control}
                register={register}
              />
              {item.transactions.length > 0 && (
                <Accordion className={classes.accordion}>
                  <AccordionSummary className={classes.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Typography className={classes.sectionTitle}>
                      Possible Matches ({item.transactions.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {item.transactions.map(
                      (transaction: Transaction, tIdx: number) => (
                        <Box key={tIdx} sx={{ mb: 1 }}>
                          <TransactionRowItem
                            transaction={transaction as Transaction}
                            index={idx}
                            control={control}
                            register={register}
                          />
                        </Box>
                      )
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
              <Divider sx={{ my: 1 }} />
            </Grid>
          ))}
        </Grid>
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

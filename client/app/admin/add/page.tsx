"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Transaction, TransactionType } from "../../models/transaction";
import StyledDate from "@/app/components/date/StyleDate";
import CategorySelector from "@/app/components/categories/CategorySelector";
import Loader from "@/app/components/loader";
import TransactionTypeSelector from "@/app/components/buttons/TransactionTypeButton";
import classes from "./page.module.scss";
import InputNumber from "@/app/components/inputs/InputNumber";
import { TextField } from "@mui/material";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { currency, DEFAULT_CURRENCY } from "@/app/models/currencies";
import { useEffect } from "react";

export default function AdminPage() {
  const { control, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      transactionType: TransactionType.EXPENSE,
      date: new Date(),
      description: "",
      amount: null,
      currency: DEFAULT_CURRENCY as currency,
      tags: [] as string[],
    },
  });

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      reset();
    }
  }, [formState, reset]);

  const { loading, addTransaction } = usePlenifyState();

  const onSubmit: SubmitHandler<Transaction> = (data) => {
    addTransaction({
      transactionType: data.transactionType,
      date: data.date,
      description: data.description,
      amount: data.amount,
      tags: data.tags,
    });
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className={classes.container}>
          <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={classes.row}>
              <div className={classes.form__item}>
                <label htmlFor="amount">Amount</label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      className={classes.form__input}
                      {...field}
                      onChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                    />
                  )}
                />
              </div>
              <div className={classes.form__item}>
                <label>Date</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => <StyledDate {...field} />}
                />
              </div>
            </div>
            <div className={classes.row}>
              <div className={classes.form__item}>
                <label htmlFor="concept">Description</label>
                <Controller
                  name="description"
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
            </div>
            <div className={`${classes.row}`}>
              <div className={classes.form__item}>
                <label htmlFor="tags">Categories</label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => <CategorySelector {...field} />}
                />
              </div>
              <div className={classes.form__item}>
                <label htmlFor="transactionType">Transaction</label>
                <Controller
                  name="transactionType"
                  control={control}
                  render={({ field }) => <TransactionTypeSelector {...field} />}
                />
              </div>
            </div>
            <div className={classes.actions}>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

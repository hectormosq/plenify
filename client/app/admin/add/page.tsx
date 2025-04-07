"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Transaction, TransactionType } from "../../models/transaction";
import StyledDate from "@/app/components/date/StyleDate";
import CategorySelector from "@/app/components/categories/CategorySelector";
import Loader from "@/app/components/loader";
import classes from "./page.module.scss";
import InputNumber from "@/app/components/inputs/InputNumber";
import { Button, TextField } from "@mui/material";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { currency, DEFAULT_CURRENCY } from "@/app/models/currencies";
import { useEffect } from "react";
import { ErrorMessage } from "@hookform/error-message";
import TransactionTypeSelector from "@/app/components/buttons/TransactionTypeSelector";

export default function AdminPage() {
  const { loading, addTransaction, categories } = usePlenifyState();
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

  const REQUIRED_FIELD_ERROR = "Field is Required";

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      reset();
    }
  }, [formState, reset]);

  const onSubmit: SubmitHandler<Transaction> = (data) => {
    addTransaction({
      transactionType: data.transactionType,
      date: data.date,
      description: data.description,
      amount: data.amount,
      tags: data.tags,
    });
  };

  const generateFake = () => {
    const categoryIds = Object.keys(categories);
    const randomIndex = Math.floor(Math.random() * categoryIds.length);
    const tags = [categoryIds[randomIndex]];

    if (Math.random() > 0.5 && categoryIds.length > 1) {
      let secondRandomIndex;
      do {
        secondRandomIndex = Math.floor(Math.random() * categoryIds.length);
      } while (secondRandomIndex === randomIndex);
      tags.push(categoryIds[secondRandomIndex]);
    }
    const date = new Date();
    const fakeTransaction: Transaction = {
      transactionType:
        Math.random() > 0.5 ? TransactionType.EXPENSE : TransactionType.INCOME,
      date: date,
      description: "Fake Transaction " + date.toISOString(),
      amount: Math.floor(Math.random() * 501), // Random amount between 0 and 500
      tags: tags,
    };
    addTransaction(fakeTransaction);
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
                  rules={{ required: REQUIRED_FIELD_ERROR }}
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
                <ErrorMessage errors={formState.errors} name="amount" />
              </div>
              <div className={classes.form__item}>
                <label>Date</label>
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: REQUIRED_FIELD_ERROR }}
                  render={({ field }) => <StyledDate {...field} />}
                />
                <ErrorMessage errors={formState.errors} name="date" />
              </div>
            </div>
            <div className={classes.row}>
              <div className={classes.form__item}>
                <label htmlFor="concept">Description</label>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: REQUIRED_FIELD_ERROR }}
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
                <ErrorMessage errors={formState.errors} name="description" />
              </div>
            </div>
            <div className={`${classes.row}`}>
              <div className={classes.form__item}>
                <label htmlFor="tags">Categories</label>
                <Controller
                  name="tags"
                  control={control}
                  rules={{ required: REQUIRED_FIELD_ERROR }}
                  render={({ field }) => <CategorySelector {...field} />}
                />
                <ErrorMessage errors={formState.errors} name="tags" />
              </div>
              <div className={classes.form__item}>
                <label htmlFor="transactionType">Transaction</label>
                <Controller
                  name="transactionType"
                  control={control}
                  rules={{ required: REQUIRED_FIELD_ERROR }}
                  render={({ field }) => <TransactionTypeSelector {...field} />}
                />
                <ErrorMessage
                  errors={formState.errors}
                  name="transactionType"
                />
              </div>
            </div>
            <div className={classes.actions}>
              <button className="button" type="submit">
                Submit
              </button>
            </div>
            <Button
              onClick={generateFake}
              color="secondary"
              style={{ marginTop: "1rem" }}
            >
              Generate Fake
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

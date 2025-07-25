"use client";

import { usePlenifyState } from "@app/hooks/usePlenifyState";
import {
  Transaction,
  TransactionDefaultForm,
  TransactionType,
} from "../../../models/transaction";
import StyledDate from "@app/components/date/StyledDate";
import CategorySelector from "@app/components/categories/CategorySelector";
import Loader from "@app/components/loader";
import classes from "./page.module.scss";
import InputNumber from "@app/components/inputs/InputNumber";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { currency, DEFAULT_CURRENCY } from "@app/models/currencies";
import { useEffect, useMemo } from "react";
import { ErrorMessage } from "@hookform/error-message";
import TransactionTypeSelector from "@app/components/buttons/TransactionTypeSelector";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const {
    addTransaction,
    updateTransaction,
    deleteConfirmation,
    deleteTransaction,
    selectTransaction,
    exitTransaction,
    confirmDelete,
    cancelDelete,
    categories,
    idle,
    loading,
    currentTransaction,
  } = usePlenifyState();

  const { id } = useParams() as { id: string[] };
  const transactionId = id?.[0] || null;

  const defaultTransaction = useMemo<TransactionDefaultForm>(
    () => ({
      account: "",
      transactionType: TransactionType.EXPENSE,
      date: new Date(),
      description: "",
      currency: DEFAULT_CURRENCY as currency,
      amount: null,
      tags: [],
    }),
    []
  );

  const { control, handleSubmit, reset, formState } = useForm({
    defaultValues: defaultTransaction,
  });

  useEffect(() => {
    return () => {
      exitTransaction();
    };
  }, [exitTransaction]);

  useEffect(() => {
    if (idle) {
      selectTransaction(transactionId ?? "");
    }
  }, [transactionId, selectTransaction, idle]);

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      reset(defaultTransaction);
    }
  }, [formState.isSubmitSuccessful, reset, defaultTransaction]);

  useEffect(() => {
    reset(
      currentTransaction && currentTransaction.id
        ? {
            account: currentTransaction.account,
            transactionType: currentTransaction.transactionType,
            date: currentTransaction.date,
            description: currentTransaction.description,
            amount: currentTransaction.amount,
            tags: currentTransaction.tags,
          }
        : defaultTransaction
    );
  }, [reset, currentTransaction, defaultTransaction]);

  const REQUIRED_FIELD_ERROR = "Field is Required";

  const onSubmit: SubmitHandler<Transaction> = (data) => {
    if (transactionId) {
      updateTransaction({
        id: transactionId,
        account: data.account,
        transactionType: data.transactionType,
        date: data.date,
        description: data.description,
        amount: data.amount,
        tags: data.tags,
      });
    } else {
      addTransaction({
        account: data.account,
        transactionType: data.transactionType,
        date: data.date,
        description: data.description,
        amount: data.amount,
        tags: data.tags,
      });
    }
  };

  const confirmDeletion = () => {
    confirmDelete(transactionId!);
    exitTransaction();
    router.push("/overview");
  };
  const handleCancel = () => {
    cancelDelete()
  };

  const onDelete = () => {
    if (transactionId) {
      deleteTransaction();
    }
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
      ) : !transactionId || currentTransaction ? (
        <div className={classes.pageContainer}>
          <div className={classes.contentContainer}>
            <div className={classes.pageHeader}>
              <h1>
                {transactionId ? "Edit Transaction" : "Add New Transaction"}
              </h1>
              {transactionId ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                >
                  Delete
                </Button>
              ) : null}
            </div>
            <form
              className={classes.form}
              onSubmit={handleSubmit((data) => {
                onSubmit(data as Transaction);
              })}
            >
              <div className={classes.row}>
                <div className={classes.form__item}>
                  <label htmlFor="account">Account</label>
                  <Controller
                    name="account"
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
                  <ErrorMessage
                    errors={formState.errors}
                    name="account"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
                    )}
                  />
                </div>
                <div className={classes.form__item}>
                  <label htmlFor="amount">Amount</label>
                  <Controller
                    name="amount"
                    control={control}
                    rules={{
                      required: REQUIRED_FIELD_ERROR,
                      min: { value: 0.01, message: "Must be greater than 0" },
                    }}
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
                  <ErrorMessage
                    errors={formState.errors}
                    name="amount"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
                    )}
                  />
                </div>
                <div className={classes.form__item}>
                  <label>Date</label>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: REQUIRED_FIELD_ERROR }}
                    render={({ field }) => <StyledDate {...field} />}
                  />
                  <ErrorMessage
                    errors={formState.errors}
                    name="date"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
                    )}
                  />
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
                  <ErrorMessage
                    errors={formState.errors}
                    name="description"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
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
                    rules={{ required: REQUIRED_FIELD_ERROR }}
                    render={({ field }) => <CategorySelector {...field} />}
                  />
                  <ErrorMessage
                    errors={formState.errors}
                    name="tags"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
                    )}
                  />
                </div>
                <div className={classes.form__item}>
                  <label htmlFor="transactionType">Transaction</label>
                  <Controller
                    name="transactionType"
                    control={control}
                    rules={{ required: REQUIRED_FIELD_ERROR }}
                    render={({ field }) => (
                      <TransactionTypeSelector {...field} />
                    )}
                  />
                  <ErrorMessage
                    errors={formState.errors}
                    name="transactionType"
                    render={(error) => (
                      <div className="form__error">{error.message}</div>
                    )}
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

          <Dialog
            open={deleteConfirmation}
            onClose={handleCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"Delete Transaction?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Do you want t delete the transaction ?.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              
              <Button onClick={handleCancel} autoFocus>
                Cancel
              </Button>
              <Button onClick={confirmDeletion}>Confirm</Button>
            </DialogActions>
          </Dialog>
        </div>
      ) : (
        <>
          <div>Transaction not Found</div>
        </>
      )}
    </>
  );
}

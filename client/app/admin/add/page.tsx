"use client";

import { useState } from "react";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { TransactionType } from "../../models/transaction";
import StyledDate from "@/app/components/Date/StyleDate";
import CategorySelector from "@/app/components/categories/CategorySelector";
import Loader from "@/app/components/loader";
import TransactionTypeButtonSelector from "@/app/components/Buttons/TransactionTypeButton";
import dayjs from "dayjs";
import classes from "./page.module.scss";

export default function AdminPage() {
  const defaultTransaction = {
    transactionType: TransactionType.EXPENSE,
    date: dayjs(),
    description: "",
    amount: 0,
    currency: "EUR",
    tags: [],
  };
  const { loading, addTransaction } = usePlenifyState();
  const [transactionForm, setTransactionForm] = useState(defaultTransaction);

  const handleChange = (inputIdentifier: string, newValue: unknown) => {
    setTransactionForm((prevState) => {
      return {
        ...prevState,
        [inputIdentifier]: newValue,
      };
    });
  };

  const handleSubmit = () => {
    addTransaction({
      transactionType: transactionForm.transactionType,
      date: transactionForm.date.toDate(),
      description: transactionForm.description,
      amount: transactionForm.amount,
      tags: transactionForm.tags,
    });
    handleReset();
  };

  const handleReset = () => {
    setTransactionForm(defaultTransaction);
  };
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className={classes.container}>
          <form className={classes.form} action={handleSubmit}>
            <div className={classes.row}>
              <div className={classes.form__item}>
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  required
                  value={transactionForm.amount}
                  onChange={(e) => {
                    handleChange("amount", parseFloat(e.target.value));
                  }}
                />
              </div>
              <div className={classes.form__item}>
                <label>Date</label>
                <StyledDate
                  date={transactionForm.date}
                  onChangeDate={(date) => handleChange("date", date)}
                />
              </div>
            </div>
            <div className={classes.row}>
              <div className={classes.form__item}>
                <label htmlFor="concept">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                  value={transactionForm.description}
                  onChange={(e) => {
                    handleChange("description", e.target.value);
                  }}
                />
              </div>
            </div>
            <div className={`${classes.row}`}>
              <div className={classes.form__item}>
                <label htmlFor="tags">Categories</label>
                <CategorySelector
                  selectedCategories={transactionForm.tags}
                  onSelectCategory={(categoryList) =>
                    handleChange("tags", categoryList)
                  }
                />
              </div>
              <div className={classes.form__item}>
                <label htmlFor="transactionType">Transaction</label>
                <TransactionTypeButtonSelector
                  transactionType={transactionForm.transactionType}
                  onTransactionChange={(transactionType) =>
                    handleChange("transactionType", transactionType)
                  }
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

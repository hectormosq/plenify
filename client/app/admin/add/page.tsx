"use client";

import classes from "./page.module.scss";
import { useState } from "react";
import CategorySelector from "@/app/components/categories/CategorySelector";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import Loader from "@/app/components/loader";
import { TransactionType } from "../../models/transaction";
import TransactionTypeButtonSelector from "@/app/components/Buttons/TransactionTypeButton";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import StyledDate from "@/app/components/Date/StyleDate";

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
  const [categoryList, setCategoryList] = useState<string[]>(
    defaultTransaction.tags
  );
  const [transactionType, setTransactionType] = useState<TransactionType>(
    defaultTransaction.transactionType
  );
  const [transactionDate, setTransactionDate] = useState<Dayjs>(
    defaultTransaction.date
  );
  const [transactionAmount, setTransactionAmount] = useState<number>(
    defaultTransaction.amount
  );
  const [transactionDescription, setTransactionDescription] = useState<string>(
    defaultTransaction.description
  );

  // TODO Make this configurable
  const transactionCurrency = "EUR";

  const handleSubmit = () => {
    addTransaction({
      transactionType,
      date: transactionDate.toDate(),
      description: transactionDescription,
      amount: transactionAmount,
      currency: transactionCurrency,
      tags: categoryList,
    });
    handleReset();
  };

  const handleReset = () => {
    setTransactionAmount(defaultTransaction.amount);
    setTransactionDescription(defaultTransaction.description);
    setTransactionDate(defaultTransaction.date);
    setCategoryList(defaultTransaction.tags);
    setTransactionType(defaultTransaction.transactionType);
  }  
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <form className={classes.form} action={handleSubmit}>
            <div className={classes.row}>
              <p>
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  required
                  value={transactionAmount}
                  onChange={(e) => {
                    setTransactionAmount(parseFloat(e.target.value));
                  }}
                />
              </p>
              <div>
                <label htmlFor="operation_date">Date</label>
                <StyledDate
                  date={transactionDate}
                  onSetDate={setTransactionDate}
                />
              </div>
            </div>
            <div className={classes.row}>
              <p>
                <label htmlFor="concept">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                  value={transactionDescription}
                  onChange={(e) => {
                    setTransactionDescription(e.target.value);
                  }}
                />
              </p>
            </div>
            <div className={`${classes.row} `}>
              <div className={classes.fullWidth}>
                <label htmlFor="category_list">Categories</label>
                <CategorySelector
                  selectedCategories={categoryList}
                  onSelectCategory={setCategoryList}
                />
              </div>
              <div className={classes.fullWidth}>
                <label htmlFor="transactionType">Transaction</label>
                <TransactionTypeButtonSelector
                  transactionType={transactionType}
                  onTransactionChange={setTransactionType}
                />
              </div>
            </div>
            <p className={classes.actions}>
              <button type="submit">Submit</button>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

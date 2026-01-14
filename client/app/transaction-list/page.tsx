"use client";

import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import { usePlenifyState } from "../hooks/usePlenifyState";
import { MonthSelector } from "../components/date/MonthSelector";
import dayjs, { Dayjs } from "dayjs";
import classes from "../dashboard/dashboard.module.css";

export default function TransactionListPage() {
  const { loading, transactions, setActiveDate, activeFromDate } = usePlenifyState();

  const handleSetActiveDate = (date: Dayjs) => {
    setActiveDate(date.toString());
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className={classes.dashboardContainer}>
          <MonthSelector
            value={dayjs(activeFromDate)}
            onChange={handleSetActiveDate}
          />
          <TransactionList transactionList={transactions.ALL} />
        </div>
      )}
    </>
  );
}

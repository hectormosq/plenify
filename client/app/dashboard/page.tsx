"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import Link from "next/link";
import FinanceOverviewTabs from "../components/finance-overview-tabs";
import { UtilsType } from "../models/transaction";

import dayjs, { Dayjs } from "dayjs";
import { MonthSelector } from "../components/date/MonthSelector";

export default function DashboardPage() {
  const { loading, transactions, setActiveDate, activeFromDate } =
    usePlenifyState();
  const recentTransactions = transactions[UtilsType.ALL].slice(0, 5);

  const handleSetActiveDate = (date: Dayjs) => {
    setActiveDate(date.toString());
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className={classes.dashboardContainer}>
          {/* TODO: Add summary chart here 
          <div className={classes.summaryContainer}>
            <p>TODO Summary Chart</p>
          </div>
          */}
          <div className={classes.overviewContainer}>
            <MonthSelector
              value={dayjs(activeFromDate)}
              onChange={handleSetActiveDate}
            />
            <FinanceOverviewTabs />
          </div>
          <div className={classes.addSection}>
            <Link href="/admin/add">Add</Link>
          </div>
          <div className={classes.transactionsContainer}>
            <div className={classes.transactionsHeader}>
              <div>Recent Transactions</div>
              <div>
                <Link href="/transaction-list">See All</Link>
              </div>
            </div>
            <TransactionList transactionList={recentTransactions} />
          </div>
        </div>
      )}
    </>
  );
}

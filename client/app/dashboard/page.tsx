"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import Link from "next/link";
import FinanceOverviewTabs from "../components/finance-overview-tabs";

export default function DashboardPage() {
  const { loading, transactions } = usePlenifyState();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className={classes.dashboardContainer}>
          <div className={classes.summaryContainer}>
            <p>TODO Summary Chart</p>
          </div>
          <div className={classes.overviewContainer}>
            <FinanceOverviewTabs />
          </div>
          <div className={classes.addSection}>
            <button>Add</button>
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

"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";

export default function DashboardPage() {
  const { loading, transactions } = usePlenifyState();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <div>
            <p>Summary</p>
          </div>
          <div>
            <p>Pie</p>
          </div>
          <div>
            <div className={classes.transactionsHeader}>
              <div>Recent Transactions</div>
              <div>See All</div>
            </div>
            <TransactionList transactionList={recentTransactions} />
          </div>
        </div>
      )}
    </>
  );
}

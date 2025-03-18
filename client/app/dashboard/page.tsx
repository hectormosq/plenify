"use client";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";

export default function DashboardPage() {
  const { loading, transactions } = usePlenifyState();

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
            <p>Recent Transactions</p>
            <TransactionList transactionList={transactions} />
          </div>
        </div>
      )}
    </>
  );
}

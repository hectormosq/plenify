"use client";

import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import { usePlenifyState } from "../hooks/usePlenifyState";

export default function TransactionListPage() {
  const { loading, transactions, reset } = usePlenifyState();

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <TransactionList transactionList={transactions.ALL} />
      )}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          style={{
            padding: ".75rem 2rem",
            background: "grey",
            margin: "10px 0",
          }}
          onClick={reset}
        >
          Delete data
        </button>
      </div>
    </>
  );
}

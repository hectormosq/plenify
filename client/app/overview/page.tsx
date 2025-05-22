"use client";

import Loader from "../components/loader";
import { usePlenifyState } from "../hooks/usePlenifyState";

export default function TransactionListPage() {
  const { loading, transactions } = usePlenifyState();

  console.log("transactions", transactions);
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>OverView</div>
      )}
     
    </>
  );
}

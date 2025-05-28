"use client";

import Loader from "../components/loader";
import { usePlenifyState } from "../hooks/usePlenifyState";
import dayjs from "dayjs";
import { plenifyService } from "../services";
import OverviewService from "../services/overview";
import classes from "./page.module.scss";

export default function TransactionListPage() {
  const { loading } = usePlenifyState();
  const today = dayjs();
  const year = today.year();
  const firstDayOfYear = today.startOf("year").toISOString();
  const lastDayOfYear = today.endOf("year").toISOString();

  const yearTransactions = plenifyService.getTransactions(
    firstDayOfYear,
    lastDayOfYear
  );
  const overviewService = new OverviewService(yearTransactions.ALL);
  const transactionsByMonth = overviewService.getTransactionsByMonth();
  console.log({ transactionsByMonth });
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <table className={classes.table}>
            <thead>

            
            {Array.from({ length: 12 }, (_, i) => {
              const month = dayjs().month(i).format("MM");
              const monthName = dayjs().month(i).format("MMMM");
              const key = `${year}${month}`;
              return (
                <th key={key}>
                  <div>
                    {monthName}
                  </div>
                </th>
              );
            })}
            </thead>
            <tbody>

            
            {Array.from({ length: 12 }, (_, i) => {
              const month = dayjs().month(i).format("MM");
              const key = `${year}${month}`;
              const transactions = transactionsByMonth[key] || {};
              return (
                <td key={key}>
                  <div>
                    {transactions.total?.toLocaleString()}
                  </div>
                </td>
              );
            })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

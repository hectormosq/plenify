"use client";

import Loader from "../components/loader";
import { usePlenifyState } from "../hooks/usePlenifyState";
import dayjs from "dayjs";
import { plenifyService } from "../services";
import OverviewService from "../services/overview";
import classes from "./page.module.scss";
import GrandTotalCard from "../components/Card/GrandTotalCard";
import CategoryTag from "../components/categories/CategoryTag";

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
  const transactionsByCategoryAndMonth =
    overviewService.getTransactionsByCategoryAndMonth();

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <h1>Overview for {year}</h1>
          <h2 className={classes.subHeading}>Yearly Summary</h2>
          <div className={classes.summary}>
            <GrandTotalCard
              title="Total Income"
              description={overviewService.getTotalIncome().toLocaleString()}
            />
            <GrandTotalCard
              title="Total Expense"
              description={overviewService.getTotalExpense().toLocaleString()}
            />
          </div>

          <h2 className={classes.subHeading}>Monthly Breakdown</h2>
          <div className={classes.tableContainer}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const monthName = dayjs().month(i).format("MMM");
                    const key = `${year}${month}`;
                    return (
                      <th key={key}>
                        <div>{monthName}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.keys(transactionsByCategoryAndMonth).map(
                  (categoryKey) => {
                    return (
                      <tr key={categoryKey}>
                        <td>
                          <CategoryTag id={categoryKey} />
                        </td>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = dayjs().month(i).format("MM");
                          const key = `${year}${month}`;
                          const transaction =
                            transactionsByCategoryAndMonth[categoryKey]?.[key];
                          return (
                            <td key={`${categoryKey}-${key}`}>
                              <div>
                                {transaction
                                  ? transaction.amount.toLocaleString()
                                  : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total Income</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.totalIncome || 0;
                    return (
                      <td key={key}>
                        <div>{total !== 0 ? total.toLocaleString() : ""}</div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td>Total Expense</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.totalExpense || 0;
                    return (
                      <td key={key}>
                        <div>{total !== 0 ? total.toLocaleString() : ""}</div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td>Total</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.total || 0;
                    return (
                      <td key={key}>
                        <div>
                          <span
                            className={
                              total >= 0 ? classes.positive : classes.negative
                            }
                          >
                            {total !== 0 ? total.toLocaleString() : ""}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

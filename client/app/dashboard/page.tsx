"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import ChartService from "../services/chart";
import Link from "next/link";
import FinanceOverviewTabs from "../components/finance-overview-tabs";

export default function DashboardPage() {
  const { loading, transactions, categories } = usePlenifyState();
  // TODO fix categories to be defined

  const pieChart = new ChartService(transactions, categories!);
  pieChart.createSeries();
  const series = [pieChart.getSeries(0), pieChart.getSeries(1)];
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
          <div className={classes.summaryChart}>
            <FinanceOverviewTabs expenses={series} incomes={series}  />
          </div>
          <div>
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

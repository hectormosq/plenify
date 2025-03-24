"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import { PieChart } from "@mui/x-charts/PieChart";
import ChartService from "../services/chart";

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
            {series && series.length > 0 ? (
              <PieChart
                series={[
                  {
                    innerRadius: 115,
                    outerRadius: 70,
                    paddingAngle: 1.5,
                    cornerRadius: 2,
                    data: series[0],
                  },
                  {
                    innerRadius: 120,
                    outerRadius: 150,
                    paddingAngle: 1.25,
                    cornerRadius: 2,
                    data: series[1],
                  },
                ]}
                width={400}
                height={300}
                slotProps={{
                  legend: { hidden: true },
                }}
              />
            ) : (
              <div>No data to display</div>
            )}
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

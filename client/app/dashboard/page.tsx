"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import { PieChart } from '@mui/x-charts/PieChart';
import ChartService from "../services/chart";

export default function DashboardPage() {
  const { loading, transactions, categories } = usePlenifyState();
  // TODO fix categories to be defined
  const pieChart = new ChartService(transactions, categories!);
  
  pieChart.format();
  console.log(pieChart);
  const recentTransactions = transactions.slice(0, 5);
  const data1 = [
    { label: "Group A", value: 45, color: "#FFB3B3" },
    { label: "Group B", value: 10, color: "#A7C7E7" },
    { label: "Group C", value: 15, color: "#FFFACD" },
    { label: "Group D", value: 25, color: "#B0E57C" },
    { label: "Group E", value: 5, color: "#D2B48C" },
  ];
  const data2 = [
    { label: "A1", value: 20, color: "#FFC7C7" },
    { label: "A2", value: 25, color: "#FFA3A3" },
    { label: "B1", value: 7, color: "#B8D4F0" },
    { label: "B2", value: 3, color: "#91B6DA" },
    { label: "C1", value: 5, color: "#FFFFD9" },
    { label: "C2", value: 10, color: "#FFF4B0" },
    { label: "D1", value: 10, color: "#C4EDA2" },
    { label: "D2", value: 15, color: "#9FD766" },
    { label: "E1", value: 5, color: "#AD8A62" },
  ];

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
            <PieChart
              series={[
                {
                  innerRadius: 115,
                  outerRadius: 70,
                  paddingAngle: 1.5,
                  cornerRadius: 2,
                  data: pieChart._series[0],
                },
                {
                  innerRadius: 120,
                  outerRadius: 150,
                  paddingAngle: 1.25,
                  cornerRadius: 2,
                  data: pieChart._series[1],
                },
              ]}
              width={400}
              height={300}
              slotProps={{
                legend: { hidden: true },
              }}
            />
          
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

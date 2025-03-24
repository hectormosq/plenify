"use client";
import classes from "./dashboard.module.css";

import { usePlenifyState } from "../hooks/usePlenifyState";
import Loader from "../components/loader";
import TransactionList from "../components/transactions/transaction-list";
import { PieChart } from "@mui/x-charts/PieChart";
import ChartService from "../services/chart";
import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import Link from "next/link";

const tabProps = (index: number) => {
  return {
    id: `action-tab-${index}`,
    "aria-controls": `action-tabpanel-${index}`,
  };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return <>{value === index && <div>{children}</div>}</>;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
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
            <Tabs
              value={activeTab}
              onChange={(_: unknown, newValue: number) => {
                setActiveTab(newValue);
              }}
            >
              <Tab
                style={{ color: activeTab === 0 ? "#9ACD32" : "#ddd6cb" }}
                label="Expenses"
                {...tabProps(0)}
              />
              <Tab
                style={{ color: activeTab === 1 ? "#9ACD32" : "#ddd6cb" }}
                label="Incomes"
                {...tabProps(1)}
              />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <>
                {series && series.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        innerRadius: 115,
                        outerRadius: 70,
                        paddingAngle: 1.5,
                        cornerRadius: 2,
                        data: series[0],
                        cx: 150,
                      },
                      {
                        innerRadius: 120,
                        outerRadius: 150,
                        paddingAngle: 1.25,
                        cornerRadius: 2,
                        data: series[1],
                        cx: 150,
                      },
                    ]}
                    width={315}
                    height={300}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                  />
                ) : (
                  <div>No data to display</div>
                )}
              </>
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <>Incomes</>
            </TabPanel>
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

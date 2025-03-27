import { useState } from "react";
import { Series } from "../models/chart";
import { PieChart } from "@mui/x-charts";
import ChartService from "../services/chart";
import { usePlenifyState } from "../hooks/usePlenifyState";
import { TabsContainer, TabPanel } from "./Tabs/Tabs";

interface FinanceOverviewTabsProps {
  pieWidth: number;
  pieRadius: number;
  gap: number;
  paddingAngle: number;
  cornerRadius: number;
}

export default function FinanceOverviewTabs({
  pieWidth = 25,
  pieRadius = 70,
  gap = 5,
  paddingAngle = 1.5,
  cornerRadius = 2,
}: Partial<FinanceOverviewTabsProps>) {
  const [activeTab, setActiveTab] = useState(0);
  const { transactions, categories } = usePlenifyState();


  const pieChart = new ChartService(transactions, categories!);
  pieChart.createSeries();
  const series = [pieChart.getSeries(0), pieChart.getSeries(1)];

  return (
    <>
      <TabsContainer
        value={activeTab}
        tabs={["Expenses", "Incomes"]}
        onChange={(_: unknown, newActiveTab: number) => {
          setActiveTab(newActiveTab);
        }}
      />

      <TabPanel value={activeTab} index={0}>
        {multiLevelPieChart(series)}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {multiLevelPieChart(series, 1)}
      </TabPanel>
    </>
  );

  function multiLevelPieChart(series: Series[][], depth?: number) {
    const calculatedSeries = [];
    const maxDepth = depth || series.length;
    const lastRadius = calculateRadius(maxDepth - 1);
    const cx = lastRadius.outerRadius;

    for (let i = 0; i < maxDepth; i++) {
      const { innerRadius, outerRadius } = calculateRadius(i);
      const configSeries = {
        innerRadius,
        outerRadius,
        paddingAngle,
        cornerRadius,
        cx,
        data: series[i],
      };
      calculatedSeries.push(configSeries);
    }

    return (
      <>
        {series && series.length > 0 ? (
          <PieChart
            series={calculatedSeries}
            width={(cx + gap) * 2}
            height={(cx + gap) * 2}
            slotProps={{
              legend: { hidden: true },
            }}
          />
        ) : (
          <div>No data to display</div>
        )}
      </>
    );

    function calculateRadius(i: number) {
      const innerRadius = pieRadius + i * (pieWidth + gap);
      const outerRadius = innerRadius + pieWidth;
      return { innerRadius, outerRadius };
    }
  }
}

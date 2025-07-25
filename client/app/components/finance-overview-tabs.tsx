import { useMemo, useState } from "react";
import { Series } from "../models/chart";
import { PieChart } from "@mui/x-charts";
import { usePlenifyState } from "../hooks/usePlenifyState";
import { TabPanel, TabsContainer } from "@app/components/Tabs/Tabs";
import ChartService from "../services/chart";

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

  const incomesPieChart = useMemo(() => {
    const incomesChartService = new ChartService(
      transactions.INCOME,
      categories
    );
    incomesChartService.createSeries();
    return incomesChartService;
  }, [transactions, categories]);

  const incomeSeries = useMemo(
    () => [incomesPieChart.getSeries(0), incomesPieChart.getSeries(1)],
    [incomesPieChart]
  );

  const incomesTotal = incomesPieChart.getTotal();

  const expensesPieChart = useMemo(() => {
    const expensesChartService = new ChartService(
      transactions.EXPENSE,
      categories
    );
    expensesChartService.createSeries();
    return expensesChartService;
  }, [transactions, categories]);

  const expensesSeries = useMemo(
    () => [expensesPieChart.getSeries(0), expensesPieChart.getSeries(1)],
    [expensesPieChart]
  );

  const expensesTotal = expensesPieChart.getTotal();

  return (
    <>
      <TabsContainer
      value={activeTab}
      tabs={[
        `Expenses: ${expensesTotal.toLocaleString()}`,
        `Incomes: ${incomesTotal.toLocaleString()}`
      ]}
      onChange={(_: unknown, newActiveTab: number) => {
        setActiveTab(newActiveTab);
      }}
      />

      <TabPanel value={activeTab} index={0}>
      {multiLevelPieChart(expensesSeries)}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
      {multiLevelPieChart(incomeSeries, 1)}
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

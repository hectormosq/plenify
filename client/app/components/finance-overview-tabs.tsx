import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { Series } from "../models/chart";
import { PieChart } from "@mui/x-charts";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export default function FinanceOverviewTabs({
  expenses = [],
  incomes = [],
}: {
  expenses: Series[][];
  incomes: Series[][];
}) {
  const cx = 150;
  const [activeTab, setActiveTab] = useState(0);

  const tabProps = (index: number) => {
    return {
      id: `action-tab-${index}`,
      "aria-controls": `action-tabpanel-${index}`,
    };
  };

  function TabPanel(props: TabPanelProps) {
    const { children, value, index } = props;

    return <>{value === index && <div>{children}</div>}</>;
  }

  return (
    <>
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
        {multiLevelPieChart(expenses, cx)}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
      {multiLevelPieChart(incomes, cx)}
      </TabPanel>
    </>
  );
}
function multiLevelPieChart(expenses: Series[][], cx: number) {
    return <>
        {expenses && expenses.length > 0 ? (
            <PieChart
                series={[
                    {
                        innerRadius: 115,
                        outerRadius: 70,
                        paddingAngle: 1.5,
                        cornerRadius: 2,
                        data: expenses[0],
                        cx: cx,
                    },
                    {
                        innerRadius: 120,
                        outerRadius: 150,
                        paddingAngle: 1.25,
                        cornerRadius: 2,
                        data: expenses[1],
                        cx: cx,
                    },
                ]}
                width={305}
                height={300}
                slotProps={{
                    legend: { hidden: true },
                }} />
        ) : (
            <div>No data to display</div>
        )}
    </>;
}


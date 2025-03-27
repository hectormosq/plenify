import styled from "@emotion/styled";
import { Tab, Tabs } from "@mui/material";
import { TabPanelProps, TabsContainerProps } from "./Tabs.model";

const StyledTabs = styled(Tabs)`
  & .MuiTabs-indicator {
    background-color: var(--gradientmaincolor); // Customize the indicator color
  }

  & .MuiTab-root {
    color: var(--foreground); // Default tab color
  }

  & .MuiTab-root.Mui-selected {
    color: var(--gradientmaincolor); // Selected tab color
  }
`;

const tabProps = (index: number) => {
  return {
    id: `action-tab-${index}`,
    "aria-controls": `action-tabpanel-${index}`,
  };
};

const TabsContainer = function (props: TabsContainerProps) {
  const { tabs, ...rest } = props;
  return (
    <StyledTabs {...rest}>
      {tabs.map((tabLabel, index) => (
        <Tab key={index} label={tabLabel} {...tabProps(index)} />
      ))}
    </StyledTabs>
  );
};

const TabPanel = function (props: TabPanelProps) {
  const { children, value, index } = props;

  return <>{value === index && <div>{children}</div>}</>;
}

export {TabsContainer, TabPanel};

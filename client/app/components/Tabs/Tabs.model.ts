import { TabsProps } from "@mui/material";
export interface TabsContainerProps extends TabsProps {
    tabs: string[];
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
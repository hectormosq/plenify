import styled from "@emotion/styled"
import { Tabs } from "@mui/material";

const TabsContainer = styled(Tabs)`
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

export default TabsContainer;
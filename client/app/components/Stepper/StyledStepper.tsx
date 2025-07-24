import { Stepper, styled } from "@mui/material";

export const StyledStepper = styled(Stepper)(() => ({
[`&.MuiStepper-root .MuiStepLabel-label.Mui-active`]: {
    color: "var(--foreground)",
  },
[`&.MuiStepper-root .MuiStepLabel-label.Mui-completed`]: {
    color: "var(--maincolor)",
  },

  [`&.MuiStepper-root .MuiStepLabel-label.Mui-disabled`]: {
    color: "var(--disabled)",
  },
}))
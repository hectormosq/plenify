import { TransactionType } from "@/app/models/transaction";
import { styled, ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function TransactionTypeSelector(props: {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}) {
  const StyledToggleButton = styled(ToggleButton)(() => ({
    
    [`&.MuiButtonBase-root`]: {
      color: "var(--foreground)",
      fontFamily: "var(--fontFamily)",
      width: "100%",
    },
    [`&.Mui-selected, &.Mui-selected:hover`]: {
      backgroundColor:
        props.value === TransactionType.INCOME
          ? "var(--incomescolor)"
          : "var(--expensescolor)",
    },
  }));

  const StyledToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
    [`&.MuiToggleButtonGroup-root`]: {
      width: "100%",
    },
  }));

  const handleValueChange = (newType: TransactionType | undefined) => {
    if (newType) {
      props.onChange(newType);
    }
  };
  return (
    <StyledToggleButtonGroup
      id="transactionType"
      value={props.value}
      exclusive
      onChange={(_, newType) => handleValueChange(newType)}
    >
      <StyledToggleButton
        style={{ borderColor: "var(--incomescolor)" }}
        value={TransactionType.INCOME}
        aria-label="income"
      >
        Income
      </StyledToggleButton>
      <StyledToggleButton
        style={{ borderColor: "var(--expensescolor)" }}
        value={TransactionType.EXPENSE}
        aria-label="expense"
      >
        Expense
      </StyledToggleButton>
    </StyledToggleButtonGroup>
  );
}

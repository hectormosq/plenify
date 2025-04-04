import { TransactionType } from "@/app/models/transaction";
import { styled, ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function TransactionTypeButtonSelector(props: {
  transactionType: TransactionType;
  onTransactionChange: (type: TransactionType) => void;
}) {
  const StyledToggleButton = styled(ToggleButton)(() => ({
    ["&.Mui-selected"]: {
      backgroundColor:
        props.transactionType === TransactionType.INCOME
          ? "var(--incomescolor)"
          : "var(--expensescolor)",
    },
  }));
  return (
    <ToggleButtonGroup
      id="transactionType"
      value={props.transactionType}
      exclusive
      onChange={(_, newType) => props.onTransactionChange(newType)}
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
    </ToggleButtonGroup>
  );
}

import { Box, ListItemButton, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";
import { TransactionType } from "@/app/models/transaction";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { RowStatus } from "../model/reviewQueue";
import classes from "./QueueListItem.module.scss";

type QueueListItemProps = {
  index: number;
  description: string;
  amount: number;
  transactionType: TransactionType;
  date: Date;
  tags: string[];
  status: RowStatus;
  onSelect: (index: number) => void;
};

const STATUS_ICON: Record<RowStatus, React.ReactNode> = {
  active: <EditIcon fontSize="small" sx={{ color: "var(--maincolor)" }} />,
  saved: <CheckCircleIcon fontSize="small" sx={{ color: "var(--incomescolor)" }} />,
  skipped: <CancelIcon fontSize="small" sx={{ color: "var(--inputLabel)" }} />,
  pending: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "var(--inputLabel)" }} />,
};

export default function QueueListItem({
  index,
  description,
  amount,
  transactionType,
  date,
  tags,
  status,
  onSelect,
}: QueueListItemProps) {
  const { categories } = usePlenifyState();
  const subtitle = tags.length > 0
    ? tags.map((tag) => categories[tag]?.name).filter(Boolean).join(", ")
    : "Uncategorized";
  const isValidAmount = Number.isFinite(amount);
  const isValidDate = dayjs(date).isValid();

  return (
    <ListItemButton
      onClick={() => onSelect(index)}
      selected={status === "active"}
      className={classes.item}
    >
      <Box className={classes.statusIcon}>{STATUS_ICON[status]}</Box>
      <Box className={classes.body}>
        <Typography variant="body2" className={classes.description} noWrap>
          {description || "(No description)"}
        </Typography>
        <Typography variant="caption" className={classes.subtitle} noWrap>
          {subtitle}
        </Typography>
      </Box>
      <Box className={classes.meta}>
        <Typography
          variant="body2"
          className={
            !isValidAmount
              ? classes.invalid
              : transactionType === TransactionType.EXPENSE
              ? classes.amountExpense
              : classes.amountIncome
          }
        >
          {isValidAmount
            ? amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
            : "Invalid"}
        </Typography>
        <Typography variant="caption" className={classes.subtitle}>
          {isValidDate ? dayjs(date).format("DD/MM/YYYY") : "Invalid date"}
        </Typography>
      </Box>
    </ListItemButton>
  );
}

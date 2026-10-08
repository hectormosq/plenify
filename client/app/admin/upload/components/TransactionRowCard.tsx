import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import CategorySelector from "@/app/components/categories/CategorySelector";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Transaction, TransactionType } from "@/app/models/transaction";
import { RowState } from "../model/uploadDraft";
import classes from "./TransactionFormMapper.module.scss";

type TransactionRowCardProps = {
  transaction: Transaction;
  actions?: boolean;
  rowForm?: RowState;
  onTagsChange?: (tags: string[]) => void;
  onNotesChange?: (notes: string) => void;
  // The row's recorded decision is "skipped"; saving it again reverses that.
  skipped?: boolean;
  onConfirmMatch?: () => void;
  isLinkedMatch?: boolean;
};

export default function TransactionRowCard({
  transaction,
  actions = false,
  rowForm,
  onTagsChange,
  onNotesChange,
  skipped,
  onConfirmMatch,
  isLinkedMatch,
}: TransactionRowCardProps) {
  const { categories } = usePlenifyState();

  return (
    <Card
      variant="outlined"
      className={classes.transactionCard}
    >
      <CardContent>
        {/* Header: Account | match / skipped markers */}
        <div className={classes.cardHeader}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" className={classes.mutedText}>
              {transaction?.account}
            </Typography>
            {onConfirmMatch && (
              <Chip
                size="small"
                label="Possible Match"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>

          {onConfirmMatch && (
            <Button
              size="small"
              variant={isLinkedMatch ? "contained" : "outlined"}
              color="warning"
              onClick={onConfirmMatch}
            >
              {isLinkedMatch ? "Linked (click to unlink)" : "This is the same transaction"}
            </Button>
          )}

          {skipped && (
            <Chip size="small" label="Skipped" variant="outlined" className={classes.dateChip} />
          )}
        </div>

        {/* Body: Description/Notes | Categories | Date | Amount */}
        <Grid container spacing={1} alignItems="flex-start">
          {/* Col 1: Description & Notes */}
          <Grid size={{ xs: 8, md: 4 }}>
            <Box sx={{ mb: 1 }}>
              <Typography className={classes.sectionTitle} variant="body1">
                {transaction.description}
              </Typography>
            </Box>
            {actions && (
              <TextField
                fullWidth
                className={classes.themedTextField}
                placeholder="Add notes..."
                variant="outlined"
                size="small"
                value={rowForm?.notes ?? ""}
                onChange={(e) => onNotesChange?.(e.target.value)}
              />
            )}
          </Grid>

          {/* Col 2: Categories */}
          <Grid size={{ xs: 8, md: 4 }}>
            <Typography variant="caption" className={classes.columnTitle}>
              Categories
            </Typography>
            {actions ? (
              <CategorySelector
                value={rowForm?.tags ?? []}
                onChange={(tags) => onTagsChange?.(tags)}
              />
            ) : (
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {transaction.tags && transaction.tags.length > 0 ? (
                  transaction.tags.map((tag, i) => (
                    <Chip
                      key={i}
                      label={categories[tag]?.name || tag}
                      size="small"
                      sx={{
                        backgroundColor: categories[tag]?.color,
                        color: "#fff",
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" className={classes.mutedText}>-</Typography>
                )}
              </Box>
            )}
          </Grid>

          {/* Col 3: Date */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="caption" className={classes.columnTitle}>
              Date
            </Typography>
            {transaction.date && dayjs(transaction.date).isValid() ? (
              <Chip
                size="small"
                variant="outlined"
                label={dayjs(transaction.date).format("DD/MM/YYYY")}
                className={classes.dateChip}
              />
            ) : (
              <Chip
                size="small"
                variant="outlined"
                color="error"
                label="Invalid date"
                title="No Date column was selected in Step 1, or this row's date value couldn't be read"
              />
            )}
          </Grid>

          {/* Col 4: Amount */}
          <Grid size={{ xs: 6, md: 2 }} display="flex" flexDirection="column" alignItems="flex-end">
            <Chip
              label={transaction?.transactionType}
              color={
                transaction?.transactionType === TransactionType.INCOME
                  ? "success"
                  : "error"
              }
              size="small"
              variant="outlined"
              sx={{ mb: 1 }}
            />
            {transaction?.amount != null && !Number.isNaN(transaction.amount) ? (
              <Typography
                variant="h5"
                component="div"
                className={transaction.transactionType === TransactionType.EXPENSE ? classes['amount--expense'] : classes['amount--income']}
              >
                {transaction.amount.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
            ) : (
              <Typography
                variant="h5"
                component="div"
                className={classes.parseError}
                title="No Amount column was selected in Step 1, or this row's amount value couldn't be read"
              >
                Invalid amount
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

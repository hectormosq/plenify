import { IconButton, styled } from "@mui/material";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PickersCalendarHeader,
} from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import classes from "./MonthSelector.module.scss";

export function MonthSelector({
  value,
  onChange,
}: {
  value: Dayjs;
  onChange: (date: Dayjs) => void;
}) {
  const currentMonth = value || dayjs();
  return (
    <div className={classes.monthSelector}>
      <IconButton
        aria-label="previous month"
        onClick={() => onChange(currentMonth.subtract(1, "month"))}
      >
        <ArrowLeftIcon />
      </IconButton>
      <button>{currentMonth.format("MMMM")}</button>
    <IconButton
      disabled={currentMonth.isSame(dayjs(), "month")}
      onClick={() => onChange(currentMonth.add(1, "month"))}
      aria-label="next month"
    >
      <ArrowRightIcon />
    </IconButton>
    </div>
  );
}

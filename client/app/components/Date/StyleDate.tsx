import { styled } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";

export default function StyledDate({
  date,
  onSetDate,
}: {
  date: Dayjs;
  onSetDate: (date: Dayjs) => void;
}) {
  return (
    <StyledDateLocal
      value={date}
      onChange={(e) => {
        onSetDate(e as Dayjs);
      }}
    />
  );
}

const StyledDateLocal = styled(DatePicker)(() => ({
  [`.MuiSvgIcon-root`]: {
    color: "var(--inputLabel)",
  },
}));

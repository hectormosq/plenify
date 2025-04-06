import { styled } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";

export default function StyledDate({
  date,
  onChangeDate,
}: {
  date: Dayjs;
  onChangeDate: (date: Dayjs) => void;
}) {
  return (
    <StyledDateLocal
      className="datePicker"
      value={date}
      onChange={(e) => {
        onChangeDate(e as Dayjs);
      }}
    />
  );
}

const StyledDateLocal = styled(DatePicker)(() => ({
  [`&.MuiFormControl-root`]: {
    width: "100%",
  },
  [`.MuiSvgIcon-root`]: {
    color: "var(--inputLabel)",
  },
}));

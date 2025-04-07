import { styled } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";


export default function StyledDate({
  value: date,
  onChange: onChangeDate,
}: {
  value: Date;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <StyledDateLocal
      className="datePicker"
      value={dayjs(date)}
      onChange={(e) => {
        onChangeDate(e?.toDate());
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

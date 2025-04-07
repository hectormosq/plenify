import { NumericFormat, OnValueChange } from "react-number-format";
import { TextField } from "@mui/material";
import { DEFAULT_CURRENCY } from "@/app/models/currencies";

export default function InputNumber({
  value,
  onNumberChange,
  prefix = DEFAULT_CURRENCY,
}: {
  value: number | null;
  onNumberChange: OnValueChange;
  prefix?: string;
}) {
  return (
    <NumericFormat
      value={value}
      onValueChange={onNumberChange}
      prefix={prefix + ' '}
      customInput={TextField}
      decimalScale={2}
      fixedDecimalScale
      thousandSeparator
    />
  );
}

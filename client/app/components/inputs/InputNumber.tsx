import { NumericFormat, OnValueChange } from "react-number-format";
import { TextField } from "@mui/material";
import { DEFAULT_CURRENCY } from "@/app/models/currencies";

export default function InputNumber({
  value,
  onNumberChange,
  prefix = DEFAULT_CURRENCY,
  className
}: {
  value: number | null;
  onNumberChange: OnValueChange;
  prefix?: string;
  className?: string;
}) {
  return (
    <NumericFormat
      className={className}
      value={value}
      onValueChange={onNumberChange}
      prefix={prefix + " "}
      customInput={TextField}
      decimalScale={2}
      fixedDecimalScale
      thousandSeparator
    />
  );
}

import { NumericFormat, OnValueChange } from "react-number-format";
import { TextField } from "@mui/material";
import { DEFAULT_CURRENCY } from "@app/models/currencies";

export default function InputNumber({
  value,
  onChange: onNumberChange,
  prefix = DEFAULT_CURRENCY,
  className,
}: {
  value: number | null;
  onChange: OnValueChange;
  prefix?: string;
  className?: string;
}) {
  return (
    <>
      <NumericFormat
        className={className}
        value={value ?? ""} // https://github.com/s-yadav/react-number-format/issues/727#issuecomment-1617157506
        onValueChange={(value, sourceInfo) => {
          onNumberChange(value, sourceInfo);
        }}
        prefix={prefix + " "}
        customInput={TextField}
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator
      />
    </>
  );
}

import { Select, SelectChangeEvent, styled } from "@mui/material";

export default function StyledSelect({
    name,
  value,
  onChange,
  options = [],
  displayNone = true,
  className = "",
}: {
    name: string;
  value?: unknown;
  onChange: (value: SelectChangeEvent<unknown>) => void;
  options: { key: string; label: string }[];
  displayNone?: boolean;
  className?: string;
}) {
  return (
    <StyledSelectLocal
      className={className}
      value={value}
      native={true}
      onChange={onChange}
        name={name}
    >
     
      {displayNone && <option value="">None</option>}
      {options.map((option) => (
        <option key={`${option.key}`} value={option.key}>
          {option.label}
        </option>
      ))}
    </StyledSelectLocal>
  );
}

const StyledSelectLocal = styled(Select)(() => ({
  [`&.MuiSelect-root`]: {
    width: "100%",
    color: "#ddd6cb",
    borderradius: "4px",
    border: "1px solid var(--border)",
  },
  [`&.MuiSelect-select`]: {
    padding: 0,
  },
  [`.MuiSvgIcon-root`]: {
    color: "#ddd6cb",
  },
}));

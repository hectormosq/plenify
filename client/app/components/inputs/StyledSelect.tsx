import { MenuItem, Select, styled } from "@mui/material";

export default function StyledSelect({
  value,
  onChange,
  options = [],
  displayNone = true,
  className = "",
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  options: { key: string; label: string }[];
  displayNone?: boolean;
  className?: string;
}) {
  return (
    <StyledSelectLocal
      className={className}
      value={value}
      onChange={(e) => {
        console.log("inStyledSelect");
        onChange(e.target.value as string);
      }}

    >
      {displayNone && <MenuItem value="">None</MenuItem>}
      {options.map((option, i) => (
        <MenuItem key={i} value={option.key}>
          {option.label}
        </MenuItem>
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

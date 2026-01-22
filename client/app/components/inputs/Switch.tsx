import { Switch as MuiSwitch, SwitchProps as MuiSwitchProps, FormControlLabel, FormControlLabelProps, styled } from "@mui/material";
import { ReactNode } from "react";

interface SwitchProps extends Omit<FormControlLabelProps, 'control' | 'label' | 'onChange'> {
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    label: ReactNode;
    disabled?: boolean;
}

const StyledFormControlLabel = styled(FormControlLabel)(() => ({
    color: "var(--foreground)",
}));

export default function Switch({ checked, onChange, label, disabled, ...props }: SwitchProps) {
  return (
    <StyledFormControlLabel
        control={
            <MuiSwitch
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            />
        }
        label={label}
        disabled={disabled}
        {...props}
    />
  );
}

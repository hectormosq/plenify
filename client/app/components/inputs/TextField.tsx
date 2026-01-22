import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, styled } from "@mui/material";

const StyledTextField = styled(MuiTextField)<MuiTextFieldProps>(() => ({
  "& .MuiInputLabel-root": {
    color: "var(--secondary)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--primary)",
  },
  "& .MuiInputBase-input": {
    color: "var(--foreground)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.23)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--foreground)",
  },
}));

export default function TextField(props: MuiTextFieldProps) {
  return <StyledTextField {...props} />;
}

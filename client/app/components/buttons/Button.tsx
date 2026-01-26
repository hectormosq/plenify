import { Button as MuiButton, ButtonProps as MuiButtonProps, styled } from "@mui/material";

const StyledButton = styled(MuiButton)<MuiButtonProps>(() => ({
  textTransform: "none",
  fontWeight: 500,
}));

export default function Button({ children, ...props }: MuiButtonProps) {
  return (
    <StyledButton {...props}>
      {children}
    </StyledButton>
  );
}

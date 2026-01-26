import { Card as MuiCard, CardContent as MuiCardContent, Typography, styled, Box, Stack } from "@mui/material";
import { ReactNode } from "react";

const StyledCard = styled(MuiCard)(() => ({
  backgroundColor: "var(--componentBackground)",
  color: "var(--foreground)",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  marginBottom: "1rem",
  "& .MuiCardContent-root": {
      color: "var(--foreground)",
      padding: "24px",
      "&:last-child": { paddingBottom: "24px" }
  },
  "& .MuiTypography-colorTextSecondary": {
    color: "var(--secondary)", // Using CSS Variable for secondary text
  },
  "& .MuiTypography-root": {
    color: "var(--foreground)", // Default to foreground for other typography
  }
}));

interface CardProps {
    title?: ReactNode;
    icon?: ReactNode;
    action?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export default function Card({ title, icon, action, description, children, className }: CardProps) {
  return (
    <StyledCard className={className}>
      <MuiCardContent>
        {/* Header Section: Icon + Title + Action */}
        {(title || icon || action) && (
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={description || children ? 2 : 0}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {icon}
                    {title && (
                        typeof title === 'string' ? 
                        <Typography variant="h6">{title}</Typography> : 
                        title
                    )}
                </Stack>
                {action && <Box>{action}</Box>}
            </Stack>
        )}
        
        {/* Description Section */}
        {description && (
            <Box mb={children ? 2 : 0}>
                {typeof description === 'string' ? (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                ) : description}
            </Box>
        )}

        {/* Body/Children Section */}
        {children}
      </MuiCardContent>
    </StyledCard>
  );
}

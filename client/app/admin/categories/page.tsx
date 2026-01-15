"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Box, Button, Chip, Typography } from "@mui/material";
import React from "react";

const CategoriesPage = () => {
  const { loading, categories, resetCategories } = usePlenifyState();
  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              All Categories
            </Typography>
            <Button variant="outlined" color="secondary" onClick={resetCategories}>
              Reset Categories
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {Object.entries(categories).map(([id, category]) => (
              <Chip
                key={id}
                label={category.name}
                sx={{
                  backgroundColor: category.color,
                  color: "#fff",
                  fontWeight: "bold",
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};

export default CategoriesPage;

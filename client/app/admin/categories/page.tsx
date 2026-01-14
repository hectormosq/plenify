"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Box, Chip, Typography } from "@mui/material";
import React from "react";

const CategoriesPage = () => {
  const { loading, categories } = usePlenifyState();
  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            All Categories
          </Typography>
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

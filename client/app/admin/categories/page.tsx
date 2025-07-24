"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import React from "react";

const CategoriesPage = () => {
  const { loading, resetCategories } = usePlenifyState();
  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <button
            style={{
              padding: ".75rem 2rem",
              background: "grey",
              margin: "10px 0",
            }}
            onClick={resetCategories}
          >
            Reset Categories
          </button>
        </div>
      )}
    </>
  );
};

export default CategoriesPage;

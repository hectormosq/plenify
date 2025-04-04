"use client";

import classes from "./page.module.css";
import { useState } from "react";
import CategorySelector from "@/app/components/categories/CategorySelector";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import Loader from "@/app/components/loader";

export default function AdminPage() {
  const { loading } = usePlenifyState();
  const [categoryList, setCategoryList] = useState<string[]>([]);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <form className={classes.form}>
            <div className={classes.row}>
              <p>
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  required
                />
              </p>
              <p>
                <label htmlFor="operation_date">Date</label>
                <input
                  type="date"
                  id="operation_date"
                  name="operation_date"
                  required
                />
              </p>
            </div>
            <div className={classes.row}>
              <p>
                <label htmlFor="concept">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                />
              </p>
            </div>
            <div className={classes.row}>
              <div>
                <label htmlFor="category_list">Categories</label>
                <CategorySelector
                  selectedCategories={categoryList}
                  onSelectCategory={setCategoryList}
                />
              </div>
            </div>
            <p className={classes.actions}>
              <button type="submit">Submit</button>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

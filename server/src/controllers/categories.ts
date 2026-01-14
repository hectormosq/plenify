import { RequestHandler } from "express";

import { defaultCategory, defaultCategoryId, restCategories } from "../constants/categories.js";

export const categories: RequestHandler = (req, res, next) => {
  res.status(200).json({ data: {
    categories: {
      ...defaultCategory,
      ...restCategories
    },
    defaultCategory: defaultCategoryId,
  } });
};

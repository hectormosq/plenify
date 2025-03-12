import { RequestHandler } from "express";

const defaultCategoryId = 'f6f84c9f-f93d-4ab8-8ebd-3a759fc2d8dc';
const defaultCategory = {
  [defaultCategoryId]: {
    name: 'default',
    color: '#651fff',
  }
}

export const categories: RequestHandler = (req, res, next) => {
  res.status(200).json({ data: {
    categories: {
      ...defaultCategory,
    },
    defaultCategory: defaultCategoryId,
  } });
};

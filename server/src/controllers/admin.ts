import { RequestHandler } from "express";

export const accountMovements: RequestHandler = (req, res, next) => {
  try {
    res.status(200).json({ data: [] });
  } catch (error) {
    next(error);
  }
};

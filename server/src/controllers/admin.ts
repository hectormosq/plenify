import { RequestHandler } from "express";

export const accountMovements: RequestHandler = (req, res, next) => {
  res.status(200).json({ data: [] });
};

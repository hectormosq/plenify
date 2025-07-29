import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    timestamp: string;
  };
}

export const createErrorResponse = (message: string, status: number): ErrorResponse => {
  return {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  };
};

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Global error handler caught:", err);
  
  const status = (err as any).status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json(createErrorResponse(message, status));
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const message = `Route ${req.method} ${req.path} not found`;
  res.status(404).json(createErrorResponse(message, 404));
};

export const jsonErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof SyntaxError && 'body' in err) {
    const message = "Invalid JSON in request body";
    res.status(400).json(createErrorResponse(message, 400));
    return;
  }
  next(err);
};
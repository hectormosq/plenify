import express from "express";
import bodyParser from "body-parser";
import accountRoutes from "./routes/admin.js";
import categoriesRoutes from "./routes/categories.js";
import { globalErrorHandler, notFoundHandler, jsonErrorHandler } from "./middleware/errorHandler.js";

const port = 3200;

const app = express();

// JSON parsing with error handling
app.use(bodyParser.json());
app.use(jsonErrorHandler);

app.use((req, res, next) => {
  // TODO Check better handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(accountRoutes);
app.use(categoriesRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});

export default app;

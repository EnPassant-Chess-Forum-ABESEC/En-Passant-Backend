import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors,
    });
  }

  console.error("ERROR", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

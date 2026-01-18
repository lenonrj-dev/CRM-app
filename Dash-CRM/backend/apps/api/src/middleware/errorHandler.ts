import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";

export const errorHandler = (
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ message: err.errors[0]?.message ?? "Entrada inválida", code: "VALIDATION_ERROR" });
  }

  return res.status(500).json({ message: "Erro interno do servidor", code: "SERVER_ERROR" });
};

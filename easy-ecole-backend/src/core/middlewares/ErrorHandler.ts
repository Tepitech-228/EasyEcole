import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../validators/noteValidators";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[Error]", err);
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Erreur interne du serveur" });
}

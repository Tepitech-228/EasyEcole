import { Request, Response } from "express";

const VALID_MODULES = [
  "scolarite", "inscription", "stage", "comptabilite",
  "rh", "communication", "elearning", "orientation",
  "stock", "immobilisation", "reporting", "achats", "menu"
];

export function validateCreateProcessus(req: Request, res: Response, next: Function) {
  const errors: string[] = [];

  if (!req.body.code || typeof req.body.code !== "string" || req.body.code.trim().length === 0) {
    errors.push("Le champ 'code' est requis et doit être une chaîne non vide");
  }
  if (!req.body.libelle || typeof req.body.libelle !== "string" || req.body.libelle.trim().length === 0) {
    errors.push("Le champ 'libelle' est requis et doit être une chaîne non vide");
  }
  if (req.body.moduleSource && !VALID_MODULES.includes(req.body.moduleSource)) {
    errors.push(`Le champ 'moduleSource' doit être l'un des suivants : ${VALID_MODULES.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

export function validateUpdateProcessus(req: Request, res: Response, next: Function) {
  const errors: string[] = [];

  if (req.body.code !== undefined && (typeof req.body.code !== "string" || req.body.code.trim().length === 0)) {
    errors.push("Le champ 'code' doit être une chaîne non vide");
  }
  if (req.body.libelle !== undefined && (typeof req.body.libelle !== "string" || req.body.libelle.trim().length === 0)) {
    errors.push("Le champ 'libelle' doit être une chaîne non vide");
  }
  if (req.body.moduleSource !== undefined && !VALID_MODULES.includes(req.body.moduleSource)) {
    errors.push(`Le champ 'moduleSource' doit être l'un des suivants : ${VALID_MODULES.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

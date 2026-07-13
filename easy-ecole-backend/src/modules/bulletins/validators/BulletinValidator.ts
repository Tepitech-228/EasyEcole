import { Request, Response } from "express";

export function validerGeneration(req: Request, res: Response, next: Function) {
  const { classeId, semestre, anneeAcademiqueId } = req.body;
  const erreurs: string[] = [];

  if (!classeId) erreurs.push("classeId est requis");
  if (!semestre) erreurs.push("semestre est requis");
  if (!anneeAcademiqueId) erreurs.push("anneeAcademiqueId est requis");
  if (semestre && !['semestre1', 'semestre2'].includes(semestre)) {
    erreurs.push("semestre doit être 'semestre1' ou 'semestre2'");
  }

  if (erreurs.length) {
    return res.status(400).json({ message: erreurs.join(', ') });
  }
  return next();
}

export function validerUpdate(req: Request, res: Response, next: Function) {
  const { appreciation } = req.body;

  if (appreciation !== undefined && typeof appreciation !== 'string') {
    return res.status(400).json({ message: "appreciation doit être une chaîne de caractères" });
  }
  return next();
}

export function validerPagination(req: Request, res: Response, next: Function) {
  const { page, limit } = req.query;
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: "page doit être un nombre positif" });
  }
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({ message: "limit doit être un nombre positif" });
  }
  return next();
}

import { Request, Response } from "express";

const MAX_MONTANT = 100_000_000_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lireMontant(body: Record<string, unknown>): unknown {
  if (body.montant !== undefined) return body.montant;
  if (body.montantPaiement !== undefined) return body.montantPaiement;
  return undefined;
}

function lireIdentifiant(body: Record<string, unknown>): unknown {
  if (body.matricule !== undefined) return body.matricule;
  if (body.matriculeInscription !== undefined) return body.matriculeInscription;
  if (body.identifiant !== undefined) return body.identifiant;
  return undefined;
}

export function validerMontant(req: Request, res: Response, next: Function) {
  const brut = lireMontant(req.body || {});
  if (brut === undefined || brut === null || brut === '') return next();

  const montant = Number(brut);
  if (!Number.isFinite(montant) || montant < 0) {
    return res.status(400).json({ message: "Le montant doit ętre un nombre positif ou nul" });
  }
  if (montant > MAX_MONTANT) {
    return res.status(400).json({ message: "Le montant est trop élevé" });
  }
  return next();
}

export function validerEmail(req: Request, res: Response, next: Function) {
  const email = (req.body || {}).email;
  if (email === undefined || email === null || email === '') return next();

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ message: "Le format de l'email est invalide" });
  }
  return next();
}

export function validerIdentifiantX(req: Request, res: Response, next: Function) {
  const identifiant = lireIdentifiant(req.body || {});
  if (identifiant === undefined || identifiant === null || identifiant === '') return next();

  if (typeof identifiant !== 'string') {
    return res.status(400).json({ message: "L'identifiant (matricule) doit ętre une chaîne de caractères" });
  }
  const longueur = identifiant.trim().length;
  if (longueur < 3 || longueur > 50) {
    return res.status(400).json({ message: "L'identifiant (matricule) doit contenir entre 3 et 50 caractères" });
  }
  return next();
}

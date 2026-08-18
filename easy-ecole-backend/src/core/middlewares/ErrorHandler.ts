import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../validators/noteValidators";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[Error]", err);
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  // Erreurs multer (taille, nombre de fichiers, champ inattendu, fileFilter)
  // → 400 explicite au lieu du 500 générique (pattern DossierInscriptionRouter)
  if (err instanceof multer.MulterError) {
    let message = "Erreur lors de l'upload du fichier";
    if (err.code === 'LIMIT_FILE_SIZE') message = "Le fichier dépasse la taille maximale autorisée";
    else if (err.code === 'LIMIT_FILE_COUNT') message = "Trop de fichiers envoyés (maximum autorisé dépassé)";
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = "Champ de fichier inattendu";
    res.status(400).json({ success: false, message });
    return;
  }
  if (typeof err?.message === 'string' && err.message.startsWith('Type de fichier non autorisé')) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Erreur interne du serveur" });
}

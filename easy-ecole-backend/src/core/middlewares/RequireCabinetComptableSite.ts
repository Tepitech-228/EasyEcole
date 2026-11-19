import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";
import { SiteUtilisateur } from "../../modules/auth/models/SiteUtilisateur";

export async function RequireCabinetComptableSite(
  req: Request,
  res: Response,
  next: Function,
): Promise<Response | void> {
  if ((req as any).utilisateurRole !== RolesUtilisateur.CABINET_COMPTABLE) {
    return next();
  }

  const utilisateurId = Number((req as any).utilisateurId);
  const etablissementId = Number((req as any).etablissementId);
  if (
    !Number.isSafeInteger(utilisateurId) || utilisateurId <= 0
    || !Number.isSafeInteger(etablissementId) || etablissementId <= 0
  ) {
    return res.status(403).json({
      success: false,
      message: "Sélectionnez un site auquel votre compte de recouvrement est affecté.",
    });
  }

  try {
    const affectation = await SiteUtilisateur.findOne({
      where: { utilisateurId, etablissementId },
      attributes: ["id"],
    });
    if (!affectation) {
      return res.status(403).json({
        success: false,
        message: "Votre compte de recouvrement n'est pas affecté au site actif.",
      });
    }
    return next();
  } catch (error) {
    console.error("[BORDEREAU][SITE_SCOPE] Vérification du site actif impossible:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de vérifier l'affectation de votre compte au site.",
    });
  }
}

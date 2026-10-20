import { Request } from "express";
import { Etablissement } from "../../modules/etablissement/models/Etablissement";
import { SiteUtilisateur } from "../../modules/auth/models/SiteUtilisateur";

export async function getSurveillantSiteId(req: Request): Promise<number | null> {
  const utilisateurId = Number((req as any).utilisateurId);
  const etablissementId = Number((req as any).etablissementId);
  if (
    !Number.isSafeInteger(utilisateurId) ||
    utilisateurId <= 0 ||
    !Number.isSafeInteger(etablissementId) ||
    etablissementId <= 0
  ) {
    return null;
  }

  const [site, affectation] = await Promise.all([
    Etablissement.findOne({
      where: { id: etablissementId, actif: true },
      attributes: ["id"],
    }),
    SiteUtilisateur.findOne({
      where: { utilisateurId, etablissementId },
      attributes: ["id"],
    }),
  ]);

  return site && affectation ? etablissementId : null;
}

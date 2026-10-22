import { Request } from "express";
import { Etablissement } from "../../modules/etablissement/models/Etablissement";
import { SiteUtilisateur } from "../../modules/auth/models/SiteUtilisateur";

export async function getSurveillantSiteId(req: Request): Promise<number | null> {
  const utilisateurId = Number((req as any).utilisateurId);
  if (!Number.isSafeInteger(utilisateurId) || utilisateurId <= 0) {
    return null;
  }

  let etablissementId = Number((req as any).etablissementId);
  if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
    const affectations = await SiteUtilisateur.findAll({
      where: { utilisateurId },
      attributes: ["etablissementId"],
    });
    const siteIds = [...new Set(affectations.map(affectation => Number(affectation.etablissementId)))];
    if (siteIds.length !== 1 || !Number.isSafeInteger(siteIds[0]) || siteIds[0] <= 0) {
      return null;
    }
    etablissementId = siteIds[0];
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

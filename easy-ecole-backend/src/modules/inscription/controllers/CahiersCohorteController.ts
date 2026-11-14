import { Request, Response } from "express";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import CahierCohorteService from "../services/CahierCohorteService";

export default class CahiersCohorteController {
  static async genererTous(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.SURVEILLANT) {
      return res.status(403).json({
        success: false,
        message: "Seul un surveillant peut générer les cahiers partagés du site.",
      });
    }

    try {
      const etablissementId = await getSurveillantSiteId(req);
      if (!etablissementId) {
        return res.status(403).json({
          success: false,
          message: "Aucun site actif autorisé pour ce surveillant.",
        });
      }

      const resultat = await DatabaseConnection.getInstance().sequelize.transaction(
        transaction => CahierCohorteService.genererPourSite(etablissementId, transaction),
      );
      return res.status(200).json({ success: true, ...resultat });
    } catch (error) {
      console.error("[CahiersCohorteController.genererTous] Échec de génération des cahiers", error);
      return res.status(500).json({
        success: false,
        message: "Impossible de générer les cahiers partagés du site.",
      });
    }
  }
}

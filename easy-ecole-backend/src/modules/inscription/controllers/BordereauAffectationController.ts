import { Request, Response } from "express";
import {
  BordereauAffectationService,
  ErreurAffectationBordereau,
  EtapeAffectationBordereau,
} from "../services/BordereauAffectationService";

type SiteScopeResolver = (req: Request) => number | undefined;

export function creerHandlersAffectationBordereau(
  etape: EtapeAffectationBordereau,
  obtenirSiteScope: SiteScopeResolver,
): {
  prendreEnCharge: (req: Request, res: Response) => Promise<Response>;
  liberer: (req: Request, res: Response) => Promise<Response>;
} {
  const executer = async (
    action: "prendreEnCharge" | "liberer",
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const bordereauId = Number(req.params.id);
    const utilisateurId = Number((req as any).utilisateurId);

    try {
      if (action === "prendreEnCharge") {
        await BordereauAffectationService.prendreEnCharge(
          etape,
          bordereauId,
          utilisateurId,
          obtenirSiteScope(req),
        );
        return res.status(200).json({ success: true });
      }

      const assigneAId = await BordereauAffectationService.liberer(
        etape,
        bordereauId,
        utilisateurId,
        obtenirSiteScope(req),
      );
      return res.status(200).json({ success: true, assigneAId });
    } catch (error) {
      if (error instanceof ErreurAffectationBordereau) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      console.error(`[BordereauAffectation][${etape}][${action}]`, error);
      return res.status(500).json({ success: false, message: "Impossible de modifier l'affectation du bordereau." });
    }
  };

  return {
    prendreEnCharge: (req, res) => executer("prendreEnCharge", req, res),
    liberer: (req, res) => executer("liberer", req, res),
  };
}

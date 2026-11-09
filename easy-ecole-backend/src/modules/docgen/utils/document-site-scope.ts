import { Request } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export function getDocGenSiteId(req: Pick<Request, "utilisateurRole" | "etablissementId">): number | null | undefined {
  if (req.utilisateurRole === RolesUtilisateur.ADMIN) return undefined;

  const etablissementId = Number(req.etablissementId);
  return Number.isSafeInteger(etablissementId) && etablissementId > 0 ? etablissementId : null;
}

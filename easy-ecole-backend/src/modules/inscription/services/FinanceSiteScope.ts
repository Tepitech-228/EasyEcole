import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export interface FinanceSiteRequestContext {
  etablissementId?: unknown;
  utilisateurRole?: unknown;
}

function normaliserSiteId(value: unknown): number | undefined {
  const siteId = Number(value);
  return Number.isSafeInteger(siteId) && siteId > 0 ? siteId : undefined;
}

export function getFinanceSiteScopeId(
  req: FinanceSiteRequestContext,
  bordereauEtablissementId?: unknown,
): number | undefined {
  const activeSiteId = normaliserSiteId(req.etablissementId);
  if (activeSiteId) return activeSiteId;
  if (req.utilisateurRole === RolesUtilisateur.ADMIN) {
    return normaliserSiteId(bordereauEtablissementId);
  }
  return undefined;
}

export function canAccessFinanceWithoutSite(req: FinanceSiteRequestContext): boolean {
  return req.utilisateurRole === RolesUtilisateur.ADMIN;
}

export function canSelectFinanceSite(
  req: FinanceSiteRequestContext,
  requestedSiteId: number,
): boolean {
  return req.utilisateurRole !== RolesUtilisateur.ESA_COMPTA
    || getFinanceSiteScopeId(req) === requestedSiteId;
}

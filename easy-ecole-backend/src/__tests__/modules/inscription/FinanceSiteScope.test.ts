import {
  canAccessFinanceWithoutSite,
  canSelectFinanceSite,
  getFinanceSiteScopeId,
} from "../../../modules/inscription/services/FinanceSiteScope";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

describe("FinanceSiteScope", () => {
  it("uses the active site for ESA accounting requests instead of a bordereau's site", () => {
    const request = {
      utilisateurRole: RolesUtilisateur.ESA_COMPTA,
      etablissementId: 10,
    };

    expect(getFinanceSiteScopeId(request, 20)).toBe(10);
    expect(canSelectFinanceSite(request, 10)).toBe(true);
    expect(canSelectFinanceSite(request, 20)).toBe(false);
  });

  it("does not allow ESA accounting to access finance without an active site", () => {
    const request = { utilisateurRole: RolesUtilisateur.ESA_COMPTA };

    expect(getFinanceSiteScopeId(request, 20)).toBeUndefined();
    expect(canAccessFinanceWithoutSite(request)).toBe(false);
    expect(canSelectFinanceSite(request, 20)).toBe(false);
  });

  it("allows administrators to access finance without a site and scopes bordereau details to their site", () => {
    const request = { utilisateurRole: RolesUtilisateur.ADMIN };

    expect(canAccessFinanceWithoutSite(request)).toBe(true);
    expect(getFinanceSiteScopeId(request, 20)).toBe(20);
  });
});

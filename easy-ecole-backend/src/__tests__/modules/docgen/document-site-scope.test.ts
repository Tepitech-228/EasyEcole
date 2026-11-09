import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { getDocGenSiteId } from "../../../modules/docgen/utils/document-site-scope";

describe("getDocGenSiteId", () => {
  it("uses the active site for non-admin users", () => {
    expect(getDocGenSiteId({
      utilisateurRole: RolesUtilisateur.SECRETAIRE,
      etablissementId: 12,
    } as any)).toBe(12);
  });

  it("does not allow non-admin users without a valid active site", () => {
    expect(getDocGenSiteId({
      utilisateurRole: RolesUtilisateur.SECRETAIRE,
      etablissementId: null,
    } as any)).toBeNull();
    expect(getDocGenSiteId({
      utilisateurRole: RolesUtilisateur.SECRETAIRE,
      etablissementId: 0,
    } as any)).toBeNull();
  });

  it("keeps global access for administrators", () => {
    expect(getDocGenSiteId({
      utilisateurRole: RolesUtilisateur.ADMIN,
      etablissementId: null,
    } as any)).toBeUndefined();
  });
});

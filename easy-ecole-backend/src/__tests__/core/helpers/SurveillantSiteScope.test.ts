import { mockRequest } from "../../helpers/express-mocks";

jest.mock("../../../modules/auth/models/SiteUtilisateur", () => ({
  SiteUtilisateur: { findOne: jest.fn() },
}));
jest.mock("../../../modules/etablissement/models/Etablissement", () => ({
  Etablissement: { findOne: jest.fn() },
}));

import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";

const { SiteUtilisateur } = require("../../../modules/auth/models/SiteUtilisateur");
const { Etablissement } = require("../../../modules/etablissement/models/Etablissement");

describe("getSurveillantSiteId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne le site actif uniquement si le surveillant y est affecté", async () => {
    Etablissement.findOne.mockResolvedValue({ id: 3 });
    SiteUtilisateur.findOne.mockResolvedValue({ id: 9 });

    await expect(getSurveillantSiteId(mockRequest({
      utilisateurId: 8,
      etablissementId: 3,
    } as any))).resolves.toBe(3);
    expect(SiteUtilisateur.findOne).toHaveBeenCalledWith({
      where: { utilisateurId: 8, etablissementId: 3 },
      attributes: ["id"],
    });
  });

  it("ne retourne pas un site sans affectation ou inactif", async () => {
    Etablissement.findOne.mockResolvedValue({ id: 3 });
    SiteUtilisateur.findOne.mockResolvedValue(null);

    await expect(getSurveillantSiteId(mockRequest({
      utilisateurId: 8,
      etablissementId: 3,
    } as any))).resolves.toBeNull();

    Etablissement.findOne.mockResolvedValue(null);
    SiteUtilisateur.findOne.mockResolvedValue({ id: 9 });
    await expect(getSurveillantSiteId(mockRequest({
      utilisateurId: 8,
      etablissementId: 3,
    } as any))).resolves.toBeNull();
  });
});

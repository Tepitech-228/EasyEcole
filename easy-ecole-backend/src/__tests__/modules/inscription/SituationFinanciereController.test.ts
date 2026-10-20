import { Op } from "sequelize";
import { mockRequest, mockResponse } from "../../helpers/express-mocks";

jest.mock("../../../modules/inscription/models/CursusApprenant", () => ({
  CursusApprenant: {
    associations: {
      classe: "classe",
      niveauEtude: "niveauEtude",
      parcours: "parcours",
      anneeAcademique: "anneeAcademique",
      utilisateur: "utilisateur",
    },
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({
  DossierEtudiant: {
    associations: { echeances: "echeances" },
    findAll: jest.fn(),
  },
}));

jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: {
    associations: { apprenant: "apprenant", dossiersEtudiants: "dossiersEtudiants" },
    findAll: jest.fn(),
  },
}));

import SituationFinanciereController from "../../../modules/inscription/controllers/SituationFinanciereController";
import { CursusApprenant } from "../../../modules/inscription/models/CursusApprenant";
import { DossierEtudiant } from "../../../modules/inscription/models/DossierEtudiant";
import { Utilisateur } from "../../../modules/auth/models/Utilisateur";

describe("SituationFinanciereController.getSituation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("filters the cursus by matching student ids for name and matricule searches", async () => {
    (DossierEtudiant.findAll as jest.Mock).mockResolvedValue([{ utilisateurId: 42 }]);
    (Utilisateur.findAll as jest.Mock).mockResolvedValue([{ id: 43 }]);
    (CursusApprenant.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
    const req = mockRequest({ query: { search: "diallo" } });
    (req as any).etablissementId = 4;
    const res = mockResponse();

    await SituationFinanciereController.getSituation(req, res);

    expect(CursusApprenant.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        etablissementId: 4,
        utilisateurId: { [Op.in]: [43, 42] },
      }),
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("sums string-form amounts numerically instead of concatenating them", async () => {
    (DossierEtudiant.findAll as jest.Mock).mockResolvedValue([]);
    (Utilisateur.findAll as jest.Mock).mockResolvedValue([]);
    (CursusApprenant.findAndCountAll as jest.Mock).mockResolvedValue({
      count: 1,
      rows: [{
        utilisateur: {
          id: 8,
          nom: "Diallo",
          prenoms: "Awa",
          apprenant: { periode: "matin" },
          dossiersEtudiants: [{
            id: 5,
            matricule: "ETU-5",
            echeances: [{ montant: "1000", montantPaye: "250", statut: "partiel" }],
          }],
        },
        classe: { id: 3, libelle: "L1" },
        niveauEtude: { id: 1, libelle: "Licence" },
        parcours: { id: 2, titre: "Informatique", type: "LICENCE" },
        anneeAcademique: { id: 6, libelle: "2026-2027" },
      }],
    });
    const req = mockRequest({ query: {} });
    (req as any).etablissementId = 4;
    const res = mockResponse();

    await SituationFinanciereController.getSituation(req, res);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.data[0].totaux).toEqual({
      totalDu: 1000,
      totalPaye: 250,
      resteAPayer: 750,
      avancement: 25,
    });
    const options = (CursusApprenant.findAndCountAll as jest.Mock).mock.calls[0][0];
    const utilisateurInclude = options.include.find((include: any) => include.association === "utilisateur");
    const dossierInclude = utilisateurInclude.include.find((include: any) => include.association === "dossiersEtudiants");
    expect(dossierInclude.where).toEqual({ etablissementId: 4 });
  });
});

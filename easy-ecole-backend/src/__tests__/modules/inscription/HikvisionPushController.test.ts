jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: { findByPk: jest.fn(), findAll: jest.fn() }
}));
jest.mock("../../../modules/auth/models/Apprenant", () => ({
  Apprenant: { findOne: jest.fn() }
}));
jest.mock("../../../modules/auth/models/PersonnelAdministratif", () => ({
  PersonnelAdministratif: { findAll: jest.fn() }
}));
jest.mock("../../../modules/auth/models/Enseignant", () => ({
  Enseignant: { findAll: jest.fn() }
}));
jest.mock("../../../modules/auth/models/SiteUtilisateur", () => ({
  SiteUtilisateur: { findAll: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({
  DossierEtudiant: { findAll: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/DemandeInscription", () => ({
  DemandeInscription: { findAll: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({
  PointageTerminal: { findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/PointageTerminalEvent", () => ({
  PointageTerminalEvent: { findOne: jest.fn(), findOrCreate: jest.fn(), findAll: jest.fn() }
}));
jest.mock("../../../modules/inscription/controllers/PointageTerminalController", () => ({
  __esModule: true,
  default: { processAttendanceEvent: jest.fn() }
}));
jest.mock("../../../modules/inscription/services/PointageRealtimeService", () => ({
  __esModule: true,
  default: { emitTerminalAttendance: jest.fn() }
}));
jest.mock("../../../modules/inscription/services/PointageTerminalTokenService", () => ({
  __esModule: true,
  default: { extract: jest.fn(), hash: jest.fn(), matches: jest.fn() }
}));
jest.mock("../../../modules/inscription/services/HikvisionIsapiService", () => ({
  normalizeHikvisionEmployeeNo: (value: string) => value.replace(/[^A-Za-z0-9]/g, "").slice(0, 32)
}));
jest.mock("../../../modules/inscription/services/HikvisionPushEventParser", () => ({
  isHikvisionHeartbeat: jest.fn(),
  parseHikvisionPushEvent: jest.fn()
}));
jest.mock("../../../modules/inscription/services/HikvisionDiagnosticLogger", () => ({
  logHikvisionDiagnostic: jest.fn()
}));

import {
  resolveMatriculeAffichage,
  resolveUtilisateur
} from "../../../modules/inscription/controllers/HikvisionPushController";

const { Utilisateur } = require("../../../modules/auth/models/Utilisateur");
const { PersonnelAdministratif } = require("../../../modules/auth/models/PersonnelAdministratif");
const { Enseignant } = require("../../../modules/auth/models/Enseignant");
const { SiteUtilisateur } = require("../../../modules/auth/models/SiteUtilisateur");
const { DossierEtudiant } = require("../../../modules/inscription/models/DossierEtudiant");
const { DemandeInscription } = require("../../../modules/inscription/models/DemandeInscription");

describe("resolveUtilisateur", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DossierEtudiant.findAll.mockResolvedValue([]);
    DemandeInscription.findAll.mockResolvedValue([]);
    SiteUtilisateur.findAll.mockResolvedValue([]);
    PersonnelAdministratif.findAll.mockResolvedValue([]);
    Enseignant.findAll.mockResolvedValue([]);
    Utilisateur.findAll.mockResolvedValue([]);
  });

  describe("resolveMatriculeAffichage", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("uses the learner's full matricule, preserving its separators, instead of the normalized terminal PIN", async () => {
      DossierEtudiant.findOne.mockResolvedValue({ matricule: "2026-L1-J-26-ESA" });

      await expect(resolveMatriculeAffichage(
        { id: 43, role: "apprenant" } as any,
        3,
        "2026L1J26ESA"
      )).resolves.toBe("2026-L1-J-26-ESA");

      expect(DossierEtudiant.findOne).toHaveBeenCalledWith({
        where: { utilisateurId: 43, etablissementId: 3 },
        attributes: ["matricule"],
        order: [["updatedAt", "DESC"]]
      });
      expect(DemandeInscription.findOne).not.toHaveBeenCalled();
    });

    it("uses a submitted learner matricule when no student dossier exists yet", async () => {
      DossierEtudiant.findOne.mockResolvedValue(null);
      DemandeInscription.findOne.mockResolvedValue({ matriculeEtudiant: "2026-L1-J-26-ESA" });

      await expect(resolveMatriculeAffichage(
        { id: 43, role: "apprenant" } as any,
        3,
        "2026L1J26ESA"
      )).resolves.toBe("2026-L1-J-26-ESA");
    });

    it("keeps the existing PIN for non-learner terminal attendance", async () => {
      await expect(resolveMatriculeAffichage(
        { id: 43, role: "enseignant" } as any,
        3,
        "ENS043"
      )).resolves.toBe("ENS043");

      expect(DossierEtudiant.findOne).not.toHaveBeenCalled();
    });
  });

  it("resolves a submitted learner before a DossierEtudiant exists", async () => {
    const user = { id: 42 };
    DemandeInscription.findAll.mockResolvedValueOnce([{ utilisateurId: 42 }]);
    Utilisateur.findByPk.mockResolvedValue(user);

    await expect(resolveUtilisateur("ESA001", 3)).resolves.toBe(user);

    expect(DemandeInscription.findAll).toHaveBeenCalledWith({
      where: { matriculeEtudiant: "ESA001", etablissementId: 3 },
      attributes: ["utilisateurId"]
    });
  });

  it("resolves a submitted learner when Hikvision removes matricule separators", async () => {
    const user = { id: 43 };
    DemandeInscription.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ matriculeEtudiant: "ESA-043", utilisateurId: 43 }]);
    Utilisateur.findByPk.mockResolvedValue(user);

    await expect(resolveUtilisateur("ESA043", 3)).resolves.toBe(user);
  });

  it("does not resolve a matricule shared by different learner accounts", async () => {
    DemandeInscription.findAll.mockResolvedValueOnce([
      { utilisateurId: 42 },
      { utilisateurId: 43 }
    ]);

    await expect(resolveUtilisateur("ESA001", 3)).resolves.toBeNull();
    expect(Utilisateur.findByPk).not.toHaveBeenCalled();
  });
});

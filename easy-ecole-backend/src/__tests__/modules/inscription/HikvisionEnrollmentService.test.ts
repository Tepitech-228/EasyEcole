jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({
  PointageTerminal: { findAll: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/HikvisionEnrollment", () => ({
  HikvisionEnrollment: { findOrCreate: jest.fn(), update: jest.fn(), findAll: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({
  DossierEtudiant: { findAll: jest.fn(), associations: { utilisateur: "utilisateur" } }
}));
jest.mock("../../../modules/inscription/models/DemandeInscription", () => ({
  DemandeInscription: { findAll: jest.fn() }
}));
jest.mock("../../../modules/auth/models/Enseignant", () => ({
  Enseignant: { findOne: jest.fn(), findAll: jest.fn(), associations: { utilisateur: "utilisateur" } }
}));
jest.mock("../../../modules/auth/models/PersonnelAdministratif", () => ({
  PersonnelAdministratif: { findOne: jest.fn(), findAll: jest.fn(), associations: { utilisateur: "utilisateur" } }
}));
jest.mock("../../../modules/auth/models/SiteUtilisateur", () => ({
  SiteUtilisateur: { findOne: jest.fn(), findAll: jest.fn() }
}));
jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: { findByPk: jest.fn(), associations: { apprenant: "apprenant" } }
}));
jest.mock("../../../modules/inscription/services/HikvisionIsapiService", () => ({
  __esModule: true,
  default: { enrollStudent: jest.fn(), enrollPerson: jest.fn() }
}));

import HikvisionEnrollmentService from "../../../modules/inscription/services/HikvisionEnrollmentService";

const { PointageTerminal } = require("../../../modules/inscription/models/PointageTerminal");
const { HikvisionEnrollment } = require("../../../modules/inscription/models/HikvisionEnrollment");
const { Utilisateur } = require("../../../modules/auth/models/Utilisateur");
const { Enseignant } = require("../../../modules/auth/models/Enseignant");
const { PersonnelAdministratif } = require("../../../modules/auth/models/PersonnelAdministratif");
const { SiteUtilisateur } = require("../../../modules/auth/models/SiteUtilisateur");
const HikvisionIsapiService = require("../../../modules/inscription/services/HikvisionIsapiService").default;

describe("HikvisionEnrollmentService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("queues biometric enrollment on every active terminal even without explicit consent", async () => {
    PointageTerminal.findAll.mockResolvedValue([{ id: 8 }, { id: 9 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);

    await HikvisionEnrollmentService.enqueueStudent(42, 3, "ESA001", null);

    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 3, protocol: "hikvision_isapi", actif: true }
    });
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledTimes(2);
  });

  it("queues the student on every active Hikvision terminal for the site after consent", async () => {
    PointageTerminal.findAll.mockResolvedValue([{ id: 8 }, { id: 9 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);
    const consentementAt = new Date("2026-10-18T10:00:00Z");

    await HikvisionEnrollmentService.enqueueStudent(42, 3, "ESA001", consentementAt);

    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 3, protocol: "hikvision_isapi", actif: true }
    });
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledTimes(2);
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 42 },
      defaults: expect.objectContaining({
        terminalId: 8,
        utilisateurId: 42,
        etablissementId: 3,
        employeeNo: "ESA001",
        statut: "en_attente"
      })
    }));
  });

  it("queues an enrolled teacher to every assigned site's active terminal", async () => {
    Utilisateur.findByPk.mockResolvedValue({ id: 51, role: "enseignant" });
    Enseignant.findOne.mockResolvedValue({ matricule: "TEACH-051", photo: "teacher.jpg" });
    SiteUtilisateur.findAll.mockResolvedValue([{ etablissementId: 3 }, { etablissementId: 4 }]);
    PointageTerminal.findAll
      .mockResolvedValueOnce([{ id: 8, etablissementId: 3 }])
      .mockResolvedValueOnce([{ id: 9, etablissementId: 4 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{ statut: "en_attente" }, true]);

    const queued = await HikvisionEnrollmentService.enqueueStaffProfile(51);

    expect(queued).toBe(2);
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 51 },
      defaults: expect.objectContaining({
        etablissementId: 3,
        employeeNo: "TEACH-051"
      })
    }));
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 9, utilisateurId: 51 },
      defaults: expect.objectContaining({ etablissementId: 4 })
    }));
  });

  it("uses the staff profile photo and site assignment to queue biometric enrollment", async () => {
    Utilisateur.findByPk.mockResolvedValue({
      id: 61,
      role: "surveillant",
      photoDeProfil: "staff.jpg"
    });
    PersonnelAdministratif.findOne.mockResolvedValue({
      matricule: "STAFF-061",
      etablissementId: null
    });
    SiteUtilisateur.findAll.mockResolvedValue([{ etablissementId: 6 }]);
    PointageTerminal.findAll.mockResolvedValue([{ id: 10, etablissementId: 6 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{ statut: "en_attente" }, true]);

    const queued = await HikvisionEnrollmentService.enqueueStaffProfile(61);

    expect(queued).toBe(1);
    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 6, protocol: "hikvision_isapi", actif: true }
    });
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 10, utilisateurId: 61 },
      defaults: expect.objectContaining({
        employeeNo: "STAFF-061",
        etablissementId: 6
      })
    }));
  });

  it("sends an assigned teacher's photo and matricule to Hikvision", async () => {
    const enrollment = {
      id: 12,
      terminalId: 8,
      utilisateurId: 51,
      etablissementId: 3,
      employeeNo: "TEACH-051",
      tentatives: 0,
      update: jest.fn().mockResolvedValue(undefined)
    };
    const terminal = { id: 8, etablissementId: 3 };
    HikvisionEnrollment.update
      .mockResolvedValueOnce([0])
      .mockResolvedValueOnce([1]);
    HikvisionEnrollment.findAll.mockResolvedValue([enrollment]);
    PointageTerminal.findOne.mockResolvedValue(terminal);
    Utilisateur.findByPk.mockResolvedValue({
      id: 51,
      role: "enseignant",
      nom: "Professeur",
      prenoms: "Test"
    });
    Enseignant.findOne.mockResolvedValue({
      matricule: "TEACH-051",
      photo: "teacher.jpg"
    });
    SiteUtilisateur.findOne.mockResolvedValue({});
    HikvisionIsapiService.enrollPerson.mockResolvedValue(undefined);

    await HikvisionEnrollmentService.processPending();

    expect(HikvisionIsapiService.enrollPerson).toHaveBeenCalledWith(terminal, {
      employeeNo: "TEACH-051",
      name: "Test Professeur",
      photoFilename: "teacher.jpg",
      photoCategory: "enseignant"
    });
    expect(enrollment.update).toHaveBeenCalledWith({
      statut: "termine",
      derniereErreur: null
    });
  });

  it("retries an idempotent queue update after a lost database connection", async () => {
    HikvisionEnrollment.update
      .mockRejectedValueOnce({ parent: { code: "PROTOCOL_CONNECTION_LOST" } })
      .mockResolvedValue([0]);
    HikvisionEnrollment.findAll.mockResolvedValue([]);

    await HikvisionEnrollmentService.processPending();

    expect(HikvisionEnrollment.update).toHaveBeenCalledTimes(2);
    expect(HikvisionEnrollment.findAll).toHaveBeenCalledTimes(1);
  });

  it("does not retry queue updates for non-connection database errors", async () => {
    HikvisionEnrollment.update.mockRejectedValue({ parent: { code: "ER_NO_SUCH_TABLE" } });

    await expect(HikvisionEnrollmentService.processPending()).rejects.toEqual({
      parent: { code: "ER_NO_SUCH_TABLE" }
    });

    expect(HikvisionEnrollment.update).toHaveBeenCalledTimes(1);
  });
});

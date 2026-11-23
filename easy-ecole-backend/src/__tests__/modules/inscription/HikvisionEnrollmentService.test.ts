jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({
  PointageTerminal: { findAll: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/HikvisionEnrollment", () => ({
  HikvisionEnrollment: {
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn()
  }
}));
jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({
  DossierEtudiant: { findAll: jest.fn(), findOne: jest.fn(), associations: { utilisateur: "utilisateur" } }
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
  Utilisateur: { findByPk: jest.fn(), findAll: jest.fn(), associations: { apprenant: "apprenant" } }
}));
jest.mock("../../../modules/auth/models/Apprenant", () => ({
  Apprenant: { findAll: jest.fn() }
}));
jest.mock("../../../modules/inscription/services/HikvisionIsapiService", () => ({
  __esModule: true,
  default: { enrollStudent: jest.fn(), enrollPerson: jest.fn() }
}));

import HikvisionEnrollmentService from "../../../modules/inscription/services/HikvisionEnrollmentService";

const { PointageTerminal } = require("../../../modules/inscription/models/PointageTerminal");
const { HikvisionEnrollment } = require("../../../modules/inscription/models/HikvisionEnrollment");
const { Utilisateur } = require("../../../modules/auth/models/Utilisateur");
const { Apprenant } = require("../../../modules/auth/models/Apprenant");
const { Enseignant } = require("../../../modules/auth/models/Enseignant");
const { PersonnelAdministratif } = require("../../../modules/auth/models/PersonnelAdministratif");
const { SiteUtilisateur } = require("../../../modules/auth/models/SiteUtilisateur");
const { DossierEtudiant } = require("../../../modules/inscription/models/DossierEtudiant");
const { DemandeInscription } = require("../../../modules/inscription/models/DemandeInscription");
const HikvisionIsapiService = require("../../../modules/inscription/services/HikvisionIsapiService").default;

describe("HikvisionEnrollmentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    HikvisionEnrollment.count.mockResolvedValue(0);
    Utilisateur.findAll.mockResolvedValue([]);
    Apprenant.findAll.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("queues biometric enrollment on every active terminal even without explicit consent", async () => {
    PointageTerminal.findAll.mockResolvedValue([{ id: 8 }, { id: 9 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);

    await expect(HikvisionEnrollmentService.enqueueStudent(42, 3, "ESA001", null)).resolves.toBe(2);

    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 3, protocol: "hikvision_isapi", population: "etudiant", actif: true }
    });
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledTimes(2);
  });

  it("queues the student on every active Hikvision terminal for the site after consent", async () => {
    PointageTerminal.findAll.mockResolvedValue([{ id: 8 }, { id: 9 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);
    const consentementAt = new Date("2026-10-18T10:00:00Z");

    await HikvisionEnrollmentService.enqueueStudent(42, 3, "ESA001", consentementAt);

    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 3, protocol: "hikvision_isapi", population: "etudiant", actif: true }
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

  it("backfills validated learners and submitted applications to a student terminal", async () => {
    const terminal = { id: 8, etablissementId: 3, population: "etudiant" as const };
    DossierEtudiant.findAll.mockResolvedValue([
      { utilisateurId: 42, matricule: "ESA042" },
      { utilisateurId: 43, matricule: "ESA043" }
    ]);
    DemandeInscription.findAll
      .mockResolvedValueOnce([{ utilisateurId: 42 }])
      .mockResolvedValueOnce([{ utilisateurId: 44, matriculeEtudiant: "ESA044" }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);

    await HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(terminal);

    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledTimes(2);
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 42 },
      defaults: expect.objectContaining({ employeeNo: "ESA042" })
    }));
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 44 },
      defaults: expect.objectContaining({ employeeNo: "ESA044" })
    }));
    expect(DemandeInscription.findAll).toHaveBeenLastCalledWith({
      where: {
        etablissementId: 3,
        matriculeEtudiant: { [require("sequelize").Op.ne]: null },
        [require("sequelize").Op.or]: [
          { statutPipeline: null },
          { statutPipeline: { [require("sequelize").Op.ne]: null } },
          { soumissionComite: true },
          { dateValidation: { [require("sequelize").Op.ne]: null } }
        ]
      },
      attributes: ["utilisateurId", "matriculeEtudiant"],
      order: [["updatedAt", "DESC"]]
    });
    expect(SiteUtilisateur.findAll).not.toHaveBeenCalled();
  });

  it("links existing learner photos to student dossiers without replacing an existing dossier photo", async () => {
    const updateMissingPhoto = jest.fn().mockResolvedValue(undefined);
    const updateExistingPhoto = jest.fn();
    const terminal = { id: 8, etablissementId: 3, population: "etudiant" as const };
    DossierEtudiant.findAll.mockResolvedValue([
      { utilisateurId: 42, matricule: "ESA042", photo: null, update: updateMissingPhoto },
      { utilisateurId: 43, matricule: "ESA043", photo: "already-linked.jpg", update: updateExistingPhoto }
    ]);
    Apprenant.findAll.mockResolvedValue([
      { utilisateurId: 42, photo: "student-42.jpg" },
      { utilisateurId: 43, photo: "student-43.jpg" }
    ]);
    DemandeInscription.findAll
      .mockResolvedValueOnce([{ utilisateurId: 42 }, { utilisateurId: 43 }])
      .mockResolvedValueOnce([]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{}, true]);

    await HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(terminal);

    expect(Apprenant.findAll).toHaveBeenCalledWith({
      where: { utilisateurId: { [require("sequelize").Op.in]: [42, 43] } },
      attributes: ["utilisateurId", "photo"]
    });
    expect(updateMissingPhoto).toHaveBeenCalledWith({ photo: "student-42.jpg" });
    expect(updateExistingPhoto).not.toHaveBeenCalled();
  });

  it("backfills staff profiles without querying student enrollments on a personnel terminal", async () => {
    const terminal = { id: 9, etablissementId: 3, population: "personnel" as const };
    SiteUtilisateur.findAll.mockResolvedValue([]);
    Enseignant.findAll.mockResolvedValue([]);
    PersonnelAdministratif.findAll.mockResolvedValue([]);

    await HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(terminal);

    expect(DossierEtudiant.findAll).not.toHaveBeenCalled();
    expect(DemandeInscription.findAll).not.toHaveBeenCalled();
    expect(SiteUtilisateur.findAll).toHaveBeenCalledWith({
      where: { etablissementId: 3 },
      attributes: ["utilisateurId"]
    });
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

  it("queues an administrator by login identifier on assigned personnel terminals", async () => {
    Utilisateur.findByPk.mockResolvedValue({
      id: 62,
      role: "admin",
      identifiant: "admin-test",
      photoDeProfil: "admin.jpg",
      etablissementId: 3
    });
    SiteUtilisateur.findAll.mockResolvedValue([{ etablissementId: 3 }]);
    PointageTerminal.findAll.mockResolvedValue([{ id: 11, etablissementId: 3 }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{ statut: "en_attente" }, true]);

    const queued = await HikvisionEnrollmentService.enqueueStaffProfile(62);

    expect(queued).toBe(1);
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 11, utilisateurId: 62 },
      defaults: expect.objectContaining({
        etablissementId: 3,
        employeeNo: "admin-test"
      })
    }));
  });

  it("backfills administrators when a personnel terminal is added", async () => {
    SiteUtilisateur.findAll.mockResolvedValue([{ utilisateurId: 62 }]);
    Enseignant.findAll.mockResolvedValue([]);
    PersonnelAdministratif.findAll.mockResolvedValue([]);
    Utilisateur.findAll.mockResolvedValue([{
      id: 62,
      identifiant: "admin-test",
      photoDeProfil: "admin.jpg"
    }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{ statut: "en_attente" }, true]);

    await HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal({
      id: 11,
      etablissementId: 3,
      population: "personnel"
    });

    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 11, utilisateurId: 62 },
      defaults: expect.objectContaining({ employeeNo: "admin-test" })
    }));
  });

  it("backfills existing assigned administrators to active personnel terminals on startup", async () => {
    PointageTerminal.findAll.mockResolvedValue([{ id: 11, etablissementId: 3 }]);
    SiteUtilisateur.findAll.mockResolvedValue([{ utilisateurId: 62 }]);
    Utilisateur.findAll.mockResolvedValue([{
      id: 62,
      identifiant: "admin-test",
      photoDeProfil: "admin.jpg"
    }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{
      employeeNo: "admin-test",
      update: jest.fn()
    }, true]);

    await HikvisionEnrollmentService.enqueueAdministratorsForActiveTerminals();

    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 11, utilisateurId: 62 },
      defaults: expect.objectContaining({
        etablissementId: 3,
        employeeNo: "admin-test",
        statut: "en_attente"
      })
    }));
  });

  it("backfills submitted student applications on all active student terminals at startup", async () => {
    const terminal = { id: 8, etablissementId: 3, population: "etudiant" as const };
    PointageTerminal.findAll.mockResolvedValue([terminal]);
    DossierEtudiant.findAll.mockResolvedValue([]);
    DemandeInscription.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ utilisateurId: 42, matriculeEtudiant: "ESA042" }]);
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{ statut: "en_attente" }, true]);
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);

    await HikvisionEnrollmentService.enqueueStudentsForActiveTerminals();

    expect(PointageTerminal.findAll).toHaveBeenCalledWith({
      where: { protocol: "hikvision_isapi", population: "etudiant", actif: true },
      attributes: ["id", "etablissementId", "population"]
    });
    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 42 },
      defaults: expect.objectContaining({ employeeNo: "ESA042" })
    }));
    const demandeQuery = DemandeInscription.findAll.mock.calls[1][0];
    expect(demandeQuery.where[require("sequelize").Op.or]).toContainEqual({ statutPipeline: null });
    const reconciliationEvents = infoSpy.mock.calls
      .filter(([event]) => event === "[HIKVISION_STUDENT_RECONCILIATION]")
      .map(([, payload]) => JSON.parse(payload));
    expect(reconciliationEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ resultat: "scan_demarre", terminauxEtudiantsActifs: 1 }),
      expect.objectContaining({
        resultat: "terminal_scane",
        terminalId: 8,
        demandesAvecMatricule: 1,
        created: 1
      }),
      expect.objectContaining({ resultat: "scan_termine", terminauxScannes: 1 })
    ]));
  });

  it("logs when no active student terminal is configured", async () => {
    PointageTerminal.findAll.mockResolvedValue([]);
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);

    await HikvisionEnrollmentService.enqueueStudentsForActiveTerminals(true);

    const reconciliationEvents = infoSpy.mock.calls
      .filter(([event]) => event === "[HIKVISION_STUDENT_RECONCILIATION]")
      .map(([, payload]) => JSON.parse(payload));
    expect(reconciliationEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resultat: "aucun_terminal_etudiant_actif",
        terminauxEtudiantsActifs: 0
      })
    ]));
  });

  it("periodically rechecks submitted students without restarting completed enrollments", async () => {
    const terminal = { id: 8, etablissementId: 3, population: "etudiant" as const };
    PointageTerminal.findAll.mockResolvedValue([terminal]);
    DossierEtudiant.findAll.mockResolvedValue([]);
    DemandeInscription.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ utilisateurId: 42, matriculeEtudiant: "ESA042" }]);
    const update = jest.fn();
    HikvisionEnrollment.findOrCreate.mockResolvedValue([{
      statut: "termine",
      employeeNo: "ESA042",
      update
    }, false]);

    await HikvisionEnrollmentService.enqueueStudentsForActiveTerminals(true);

    expect(HikvisionEnrollment.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { terminalId: 8, utilisateurId: 42 }
    }));
    expect(update).not.toHaveBeenCalled();
  });

  it("uses the student dossier photo to enroll legacy applicants", async () => {
    HikvisionEnrollment.count.mockResolvedValue(1);
    const enrollment = {
      id: 21,
      terminalId: 8,
      utilisateurId: 42,
      etablissementId: 3,
      employeeNo: "ESA042",
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
      id: 42,
      role: "apprenant",
      nom: "Doe",
      prenoms: "Jane",
      apprenant: { photo: null },
      photoDeProfil: null
    });
    DossierEtudiant.findOne.mockResolvedValue({ photo: "legacy-student.jpg" });
    HikvisionIsapiService.enrollPerson.mockResolvedValue(undefined);
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);

    await HikvisionEnrollmentService.processPending();

    expect(HikvisionIsapiService.enrollPerson).toHaveBeenCalledWith(terminal, {
      employeeNo: "ESA042",
      name: "Jane Doe",
      photoFilename: "legacy-student.jpg",
      photoCategory: "apprenant"
    });
    expect(enrollment.update).toHaveBeenCalledWith({
      statut: "termine",
      derniereErreur: null
    });
    const progressEvents = infoSpy.mock.calls
      .filter(([event]) => event === "[HIKVISION_ENROLLMENT_PROGRESS]")
      .map(([, payload]) => JSON.parse(payload));
    expect(progressEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resultat: "lot_demarre",
        enrolementsEnAttente: 1,
        enrolementsDansCeLot: 1
      }),
      expect.objectContaining({
        resultat: "enrolement_en_cours",
        positionDansLeLot: 1,
        totalDansLeLot: 1
      }),
      expect.objectContaining({
        resultat: "enrolement_traite",
        photoEnvoyee: true,
        photosEnvoyees: 1
      }),
      expect.objectContaining({
        resultat: "lot_termine",
        enrolementsTraites: 1,
        photosEnvoyees: 1,
        enrolementsEnErreur: 0
      })
    ]));
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
      where: { etablissementId: 6, protocol: "hikvision_isapi", population: "personnel", actif: true }
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

  it("sends an assigned administrator's photo and login identifier to Hikvision", async () => {
    const enrollment = {
      id: 13,
      terminalId: 11,
      utilisateurId: 62,
      etablissementId: 3,
      employeeNo: "admin-test",
      tentatives: 0,
      update: jest.fn().mockResolvedValue(undefined)
    };
    const terminal = { id: 11, etablissementId: 3 };
    HikvisionEnrollment.update
      .mockResolvedValueOnce([0])
      .mockResolvedValueOnce([1]);
    HikvisionEnrollment.findAll.mockResolvedValue([enrollment]);
    PointageTerminal.findOne.mockResolvedValue(terminal);
    Utilisateur.findByPk.mockResolvedValue({
      id: 62,
      role: "admin",
      nom: "Administrateur",
      prenoms: "Test",
      identifiant: "admin-test",
      photoDeProfil: "admin.jpg",
      etablissementId: 3
    });
    SiteUtilisateur.findOne.mockResolvedValue({});
    HikvisionIsapiService.enrollPerson.mockResolvedValue(undefined);

    await HikvisionEnrollmentService.processPending();

    expect(HikvisionIsapiService.enrollPerson).toHaveBeenCalledWith(terminal, {
      employeeNo: "admin-test",
      name: "Test Administrateur",
      photoFilename: "admin.jpg",
      photoCategory: "personnel"
    });
  });

  it("moves an enrollment from an inactive terminal to the site's active terminal", async () => {
    const enrollment = {
      id: 68,
      terminalId: 3,
      utilisateurId: 71,
      etablissementId: 5,
      employeeNo: "ESA071",
      tentatives: 242,
      update: jest.fn().mockResolvedValue(undefined)
    };
    const activeTerminal = { id: 7, etablissementId: 5 };
    HikvisionEnrollment.update
      .mockResolvedValueOnce([0])
      .mockResolvedValueOnce([1]);
    HikvisionEnrollment.findAll.mockResolvedValue([enrollment]);
    HikvisionEnrollment.findOne.mockResolvedValue(null);
    PointageTerminal.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeTerminal);

    await HikvisionEnrollmentService.processPending();

    expect(PointageTerminal.findOne).toHaveBeenNthCalledWith(2, {
      where: {
        etablissementId: 5,
        protocol: "hikvision_isapi",
        actif: true
      },
      order: [["id", "ASC"]]
    });
    expect(enrollment.update).toHaveBeenCalledWith({
      terminalId: 7,
      statut: "en_attente",
      tentatives: 0,
      prochaineTentativeAt: expect.any(Date),
      derniereErreur: null
    });
    expect(HikvisionIsapiService.enrollPerson).not.toHaveBeenCalled();
  });

  it("removes a duplicate queued enrollment instead of moving it onto an occupied terminal-user pair", async () => {
    const enrollment = {
      id: 104,
      terminalId: 3,
      utilisateurId: 116,
      etablissementId: 5,
      employeeNo: "ESA116",
      tentatives: 1,
      update: jest.fn().mockResolvedValue(undefined)
    };
    const existingEnrollment = {
      id: 86,
      terminalId: 7,
      utilisateurId: 116,
      employeeNo: "ESA116",
      statut: "en_attente",
      update: jest.fn().mockResolvedValue(undefined)
    };
    const activeTerminal = { id: 7, etablissementId: 5 };
    HikvisionEnrollment.update
      .mockResolvedValueOnce([0])
      .mockResolvedValueOnce([1]);
    HikvisionEnrollment.findAll.mockResolvedValue([enrollment]);
    HikvisionEnrollment.findOne.mockResolvedValue(existingEnrollment);
    PointageTerminal.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeTerminal);

    await HikvisionEnrollmentService.processPending();

    expect(HikvisionEnrollment.findOne).toHaveBeenCalledWith({
      where: { terminalId: 7, utilisateurId: 116 }
    });
    expect(HikvisionEnrollment.destroy).toHaveBeenCalledWith({ where: { id: 104 } });
    expect(existingEnrollment.update).not.toHaveBeenCalled();
    expect(enrollment.update).not.toHaveBeenCalled();
    expect(HikvisionIsapiService.enrollPerson).not.toHaveBeenCalled();
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

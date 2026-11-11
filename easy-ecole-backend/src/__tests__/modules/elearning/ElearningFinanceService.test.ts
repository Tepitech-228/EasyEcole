jest.mock("../../../core/helpers/DatabaseConnection", () => ({
  DatabaseConnection: {
    getInstance: () => ({
      sequelize: {
        transaction: (operation: (transaction: any) => Promise<unknown>) => operation({ LOCK: { UPDATE: "UPDATE" } }),
      },
    }),
  },
}));

jest.mock("../../../modules/inscription/models/DemandeInscription", () => ({
  DemandeInscription: { findOne: jest.fn() },
}));
jest.mock("../../../modules/elearning/models/AnneeElearning", () => ({ AnneeElearning: { findOne: jest.fn() } }));
jest.mock("../../../modules/elearning/models/Audit", () => ({ Audit: { create: jest.fn() } }));
jest.mock("../../../modules/inscription/models/Cours", () => ({ Cours: { findByPk: jest.fn(), findAll: jest.fn() } }));
jest.mock("../../../modules/elearning/models/CoursEnLigne", () => ({ CoursEnLigne: { findOne: jest.fn(), findAll: jest.fn() } }));
jest.mock("../../../modules/elearning/models/Encaissement", () => ({ Encaissement: {} }));
jest.mock("../../../modules/elearning/models/Enveloppe", () => ({ Enveloppe: { findOrCreate: jest.fn() } }));
jest.mock("../../../modules/elearning/models/Mouvement", () => ({ Mouvement: { create: jest.fn() } }));
jest.mock("../../../modules/elearning/models/SelectionCours", () => ({ SelectionCours: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() } }));
jest.mock("../../../modules/elearning/models/TarifCredit", () => ({ TarifCredit: { findOne: jest.fn() } }));

import ElearningFinanceService from "../../../modules/elearning/services/ElearningFinanceService";

const { DemandeInscription } = require("../../../modules/inscription/models/DemandeInscription");
const { AnneeElearning } = require("../../../modules/elearning/models/AnneeElearning");
const { Enveloppe } = require("../../../modules/elearning/models/Enveloppe");
const { CoursEnLigne } = require("../../../modules/elearning/models/CoursEnLigne");
const { Cours } = require("../../../modules/inscription/models/Cours");
const { SelectionCours } = require("../../../modules/elearning/models/SelectionCours");
const { Mouvement } = require("../../../modules/elearning/models/Mouvement");
const { Audit } = require("../../../modules/elearning/models/Audit");

describe("ElearningFinanceService.selectCourse", () => {
  const envelope = {
    id: 11,
    statut: "ouverte",
    montantAlloue: 10000,
    montantReserve: 0,
    montantConsomme: 0,
    reload: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AnneeElearning.findOne.mockResolvedValue({ id: 2, active: true, anneeAcademiqueId: 2026 });
    DemandeInscription.findOne.mockResolvedValue({ session: { niveauEtudeId: 4, anneeAcademiqueId: 2026 } });
    Enveloppe.findOrCreate.mockResolvedValue([envelope, false]);
    envelope.reload.mockResolvedValue(envelope);
    envelope.save.mockResolvedValue(envelope);
    CoursEnLigne.findOne.mockResolvedValue({
      id: 7,
      ueId: 31,
      niveauEtudeId: 4,
      nbCredits: 16,
      coutTotal: 100,
      code: "UE-7",
      titre: "Cours de test",
    });
    Cours.findByPk.mockResolvedValue({ id: 31, semestre: "semestre1" });
    SelectionCours.findOne.mockResolvedValue(null);
  });

  it("refuses UE selection before the e-learning application is approved by committee", async () => {
    DemandeInscription.findOne.mockResolvedValue(null);

    await expect(ElearningFinanceService.selectCourse(42, 7)).rejects.toMatchObject({ statusCode: 409 });

    expect(DemandeInscription.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { utilisateurId: 42, modeFormation: "en_ligne", statutPipeline: "valide" },
    }));
    expect(Enveloppe.findOrCreate).not.toHaveBeenCalled();
    expect(CoursEnLigne.findOne).not.toHaveBeenCalled();
  });

  it("uses the academic year ID to find the course and rejects more than 30 credits in a semester", async () => {
    SelectionCours.findAll.mockResolvedValue([{ coursId: 8, credits: 15 }]);
    CoursEnLigne.findAll.mockResolvedValue([{ id: 8, ueId: 32 }]);
    Cours.findAll.mockResolvedValue([{ id: 32, semestre: "semestre1" }]);

    await expect(ElearningFinanceService.selectCourse(42, 7)).rejects.toMatchObject({
      statusCode: 409,
      message: "La limite de 30 crédits pour le semestre1 serait dépassée.",
    });

    expect(CoursEnLigne.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, statut: "publie", anneeAcademiqueId: 2026 },
    }));
    expect(SelectionCours.create).not.toHaveBeenCalled();
  });

  it("does not count credits from a different semester and stores the academic year ID", async () => {
    SelectionCours.findAll.mockResolvedValue([{ coursId: 8, credits: 15 }]);
    CoursEnLigne.findAll.mockResolvedValue([{ id: 8, ueId: 32 }]);
    Cours.findAll.mockResolvedValue([{ id: 32, semestre: "semestre2" }]);
    SelectionCours.create.mockResolvedValue({ id: 21, save: jest.fn() });
    Mouvement.create.mockResolvedValue({ id: 31 });
    Audit.create.mockResolvedValue({});

    await ElearningFinanceService.selectCourse(42, 7);

    expect(SelectionCours.create).toHaveBeenCalledWith(expect.objectContaining({
      coursId: 7,
      anneeAcademiqueId: 2026,
      credits: 16,
    }), expect.any(Object));
  });
});
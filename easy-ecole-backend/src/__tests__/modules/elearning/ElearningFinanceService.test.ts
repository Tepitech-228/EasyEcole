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
jest.mock("../../../modules/elearning/models/CoursEnLigne", () => ({ CoursEnLigne: { findOne: jest.fn() } }));
jest.mock("../../../modules/elearning/models/Encaissement", () => ({ Encaissement: {} }));
jest.mock("../../../modules/elearning/models/Enveloppe", () => ({ Enveloppe: { findOrCreate: jest.fn() } }));
jest.mock("../../../modules/elearning/models/Mouvement", () => ({ Mouvement: { create: jest.fn() } }));
jest.mock("../../../modules/elearning/models/SelectionCours", () => ({ SelectionCours: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock("../../../modules/elearning/models/TarifCredit", () => ({ TarifCredit: { findOne: jest.fn() } }));

import ElearningFinanceService from "../../../modules/elearning/services/ElearningFinanceService";

const { DemandeInscription } = require("../../../modules/inscription/models/DemandeInscription");
const { AnneeElearning } = require("../../../modules/elearning/models/AnneeElearning");
const { Enveloppe } = require("../../../modules/elearning/models/Enveloppe");
const { CoursEnLigne } = require("../../../modules/elearning/models/CoursEnLigne");

describe("ElearningFinanceService.selectCourse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AnneeElearning.findOne.mockResolvedValue({ id: 2, active: true, anneeAcademiqueId: 2026 });
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
});
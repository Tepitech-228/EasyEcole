jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({
  PointageTerminal: { findAll: jest.fn() }
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
jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: { findByPk: jest.fn(), associations: { apprenant: "apprenant" } }
}));
jest.mock("../../../modules/inscription/services/HikvisionIsapiService", () => ({
  __esModule: true,
  default: { enrollStudent: jest.fn() }
}));

import HikvisionEnrollmentService from "../../../modules/inscription/services/HikvisionEnrollmentService";

const { PointageTerminal } = require("../../../modules/inscription/models/PointageTerminal");
const { HikvisionEnrollment } = require("../../../modules/inscription/models/HikvisionEnrollment");

describe("HikvisionEnrollmentService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not queue biometric enrollment without explicit consent", async () => {
    await HikvisionEnrollmentService.enqueueStudent(42, 3, "ESA001", null);

    expect(PointageTerminal.findAll).not.toHaveBeenCalled();
    expect(HikvisionEnrollment.findOrCreate).not.toHaveBeenCalled();
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

import { mockRequest, mockResponse } from "../../helpers/express-mocks";

jest.mock("../../../core/helpers/DatabaseConnection", () => {
  const sequelize = { transaction: jest.fn() };
  return { DatabaseConnection: { getInstance: jest.fn(() => ({ sequelize })) } };
});
jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({
  PointageTerminal: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/PointageTerminalEvent", () => ({
  PointageTerminalEvent: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() }
}));
jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: { findByPk: jest.fn() }
}));
jest.mock("../../../modules/auth/models/SiteUtilisateur", () => ({
  SiteUtilisateur: { findOne: jest.fn() }
}));
jest.mock("../../../modules/etablissement/models/Etablissement", () => ({
  Etablissement: { findOne: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/Pointage", () => ({
  Pointage: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/PointageScan", () => ({
  PointageScan: { create: jest.fn() }
}));
jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({
  DossierEtudiant: { findOne: jest.fn(), associations: { echeances: "echeances" } }
}));
jest.mock("../../../modules/inscription/services/VerificationPaiementService", () => ({
  VerificationPaiementService: { verifierDossier: jest.fn() }
}));

import PointageTerminalController from "../../../modules/inscription/controllers/PointageTerminalController";
import PointageTerminalTokenService from "../../../modules/inscription/services/PointageTerminalTokenService";

const { DatabaseConnection } = require("../../../core/helpers/DatabaseConnection");
const { PointageTerminal } = require("../../../modules/inscription/models/PointageTerminal");
const { PointageTerminalEvent } = require("../../../modules/inscription/models/PointageTerminalEvent");
const { Utilisateur } = require("../../../modules/auth/models/Utilisateur");
const { SiteUtilisateur } = require("../../../modules/auth/models/SiteUtilisateur");
const { Etablissement } = require("../../../modules/etablissement/models/Etablissement");
const { Pointage } = require("../../../modules/inscription/models/Pointage");
const { PointageScan } = require("../../../modules/inscription/models/PointageScan");
const { DossierEtudiant } = require("../../../modules/inscription/models/DossierEtudiant");
const { VerificationPaiementService } = require("../../../modules/inscription/services/VerificationPaiementService");

const sequelize = DatabaseConnection.getInstance().sequelize;
const transaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined)
};

function protocolResponse(): any {
  const res: any = mockResponse();
  res.type = jest.fn().mockReturnValue(res);
  return res;
}

function admsRequest(query: Record<string, string>, body = ""): any {
  return mockRequest({ query, body, ip: "192.168.1.12", method: body ? "POST" : "GET" } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.transaction.mockResolvedValue(transaction);
  PointageTerminal.findOne.mockResolvedValue({
    id: 5,
    serialNumber: "ZK12345",
    etablissementId: 3,
    sourceIp: "192.168.1.12",
    attStamp: 4,
    update: jest.fn().mockResolvedValue(undefined)
  });
  PointageTerminalEvent.create.mockResolvedValue({ update: jest.fn().mockResolvedValue(undefined) });
  PointageTerminalEvent.findOne.mockResolvedValue(null);
  PointageTerminalEvent.findByPk.mockResolvedValue(null);
  Utilisateur.findByPk.mockResolvedValue({ id: 42, role: "personnel_administratif", etablissementId: 3 });
  SiteUtilisateur.findOne.mockResolvedValue({ utilisateurId: 42, etablissementId: 3 });
  Pointage.findOne.mockResolvedValue(null);
  Pointage.create.mockResolvedValue({ id: 77 });
  PointageScan.create.mockResolvedValue({ id: 1 });
  DossierEtudiant.findOne.mockResolvedValue({ utilisateurId: 42 });
  VerificationPaiementService.verifierDossier.mockReturnValue({ statut: "vert", message: "" });
});

describe("PointageTerminalController ADMS", () => {
  it("returns only attendance log options for an authorized serial and source IP", async () => {
    const res = protocolResponse();

    await PointageTerminalController.optionsAdms(admsRequest({ SN: "ZK12345" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("text/plain");
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("TransFlag=TransData AttLog"));
    expect(res.send).toHaveBeenCalledWith(expect.not.stringContaining("AttPhoto"));
  });

  it("rejects ADMS traffic from an IP not allowlisted for the device", async () => {
    const res = protocolResponse();
    const req = admsRequest({ SN: "ZK12345" });
    req.ip = "192.168.1.99";

    await PointageTerminalController.optionsAdms(req, res);

    expect(res.send).toHaveBeenCalledWith("ERROR");
    expect(PointageTerminalEvent.create).not.toHaveBeenCalled();
  });

  it("records a staff member's first biometric log as arrival and advances the device stamp", async () => {
    const res = protocolResponse();
    const req = admsRequest(
      { SN: "ZK12345", table: "ATTLOG", Stamp: "10" },
      "42\t2026-10-17 08:15:30\t0\t15\t0"
    );

    await PointageTerminalController.recevoirDonneesAdms(req, res);

    expect(Pointage.create).toHaveBeenCalledWith(expect.objectContaining({
      utilisateurId: 42,
      date: "2026-10-17",
      heureArrivee: "08:15:30"
    }), expect.objectContaining({ transaction }));
    expect(PointageTerminalEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      terminalId: 5,
      utilisateurId: 42,
      statut: "enregistre",
      verifyType: 15
    }), expect.objectContaining({ transaction }));
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("records a student attendance event as a passage without touching departure", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    Pointage.findOne.mockResolvedValue({ id: 77, heureArrivee: "08:00:00", heureDepart: "12:00:00", update });
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: "apprenant", etablissementId: 3 });
    const res = protocolResponse();
    const req = admsRequest(
      { SN: "ZK12345", table: "ATTLOG" },
      "42\t2026-10-17 17:02:15\t0\t15\t0"
    );

    await PointageTerminalController.recevoirDonneesAdms(req, res);

    expect(update).not.toHaveBeenCalled();
    expect(PointageScan.create).toHaveBeenCalledWith({ pointageId: 77, heure: "17:02:15" }, { transaction });
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("processes a durable Hikvision receipt without inserting a second event", async () => {
    const { createHash } = require("crypto");
    const fingerprint = createHash("sha256")
      .update(["ZK12345", "42", "2026-10-17", "08:15:30", 5, 38].join("|"))
      .digest("hex");
    const update = jest.fn().mockResolvedValue(undefined);
    PointageTerminalEvent.findByPk.mockResolvedValue({
      id: 9,
      terminalId: 5,
      fingerprint,
      statut: "en_attente",
      update
    });

    const recorded = await PointageTerminalController.processAttendanceEvent(
      { id: 5, serialNumber: "ZK12345", etablissementId: 3 } as any,
      {
        pin: "42",
        date: "2026-10-17",
        time: "08:15:30",
        statusCode: 5,
        verifyType: 38,
        utilisateurId: 42,
        eventId: 9
      }
    );

    expect(recorded.recorded).toBe(true);
    expect(recorded.mode).toBe("arrivee");
    expect(PointageTerminalEvent.create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      utilisateurId: 42,
      statut: "enregistre",
      pointageId: 77
    }), { transaction });
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("accepts a successful Hikvision face authentication (minor 75)", async () => {
    const recorded = await PointageTerminalController.processAttendanceEvent(
      { id: 5, serialNumber: "ZK12345", etablissementId: 3 } as any,
      {
        pin: "42",
        date: "2026-10-17",
        time: "08:15:30",
        statusCode: 5,
        verifyType: 75,
        utilisateurId: 42
      }
    );

    expect(recorded.recorded).toBe(true);
    expect(recorded.mode).toBe("arrivee");
    expect(Pointage.create).toHaveBeenCalledWith(expect.objectContaining({
      utilisateurId: 42,
      heureArrivee: "08:15:30"
    }), expect.objectContaining({ transaction }));
  });

  it.each([6, 76])("refuses a denied Hikvision face event (minor %i)", async (verifyType) => {
    const recorded = await PointageTerminalController.processAttendanceEvent(
      { id: 5, serialNumber: "ZK12345", etablissementId: 3 } as any,
      {
        pin: "42",
        date: "2026-10-17",
        time: "08:15:30",
        statusCode: 5,
        verifyType,
        utilisateurId: 42
      }
    );

    expect(recorded.recorded).toBe(false);
    expect(recorded.mode).toBe("refuse");
    expect(Pointage.create).not.toHaveBeenCalled();
  });

  it("does not import face or fingerprint operation logs", async () => {
    const res = protocolResponse();
    const req = admsRequest(
      { SN: "ZK12345", table: "OPERLOG" },
      "FACE PIN=42 FID=0 TMP=biometric-template"
    );

    await PointageTerminalController.recevoirDonneesAdms(req, res);

    expect(PointageTerminalEvent.create).not.toHaveBeenCalled();
    expect(Pointage.create).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("accepts ADMS traffic authenticated by the terminal token behind a tunnel", async () => {
    const token = `ptk_${"a".repeat(43)}`;
    PointageTerminal.findOne.mockResolvedValue({
      id: 5,
      serialNumber: "ZK12345",
      etablissementId: 3,
      sourceIp: null,
      deviceTokenHash: PointageTerminalTokenService.hash(token),
      attStamp: 4,
      update: jest.fn().mockResolvedValue(undefined)
    });
    const res = protocolResponse();
    const req = admsRequest({ SN: "ZK12345", token });
    req.ip = "203.0.113.50";

    await PointageTerminalController.optionsAdms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("TransFlag=TransData AttLog"));
  });

  it("rejects a wrong token even when the request comes from the allowlisted IP", async () => {
    PointageTerminal.findOne.mockResolvedValue({
      id: 5,
      serialNumber: "ZK12345",
      etablissementId: 3,
      sourceIp: "192.168.1.12",
      deviceTokenHash: PointageTerminalTokenService.hash(`ptk_${"a".repeat(43)}`),
      attStamp: 4,
      update: jest.fn().mockResolvedValue(undefined)
    });
    const res = protocolResponse();
    const req = admsRequest({ SN: "ZK12345", token: `ptk_${"b".repeat(43)}` });

    await PointageTerminalController.optionsAdms(req, res);

    expect(res.send).toHaveBeenCalledWith("ERROR");
  });

  it("returns the device token once at creation and stores only its hash", async () => {
    Etablissement.findOne.mockResolvedValue({ id: 3 });
    PointageTerminal.create.mockImplementation((payload: any) => Promise.resolve({
      id: 12,
      protocol: "zkteco_adms",
      actif: true,
      lastSeenAt: null,
      ...payload
    }));
    const req = mockRequest({
      utilisateurRole: "admin",
      body: { serialNumber: "ZK99999", nom: "Portail", sourceIp: "", etablissementId: 3 }
    } as any);
    const res: any = mockResponse();

    await PointageTerminalController.creerTerminal(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = PointageTerminal.create.mock.calls[0][0];
    expect(payload.sourceIp).toBeNull();
    expect(payload.deviceTokenHash).toMatch(/^[a-f0-9]{64}$/);
    const body = res.json.mock.calls[0][0];
    expect(body.deviceToken).toMatch(/^ptk_[A-Za-z0-9_-]{43}$/);
    expect(PointageTerminalTokenService.hash(body.deviceToken)).toBe(payload.deviceTokenHash);
    expect(body.deviceTokenHash).toBeUndefined();
  });

  it("rotates the token and invalidates the previous one", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    PointageTerminal.findOne.mockResolvedValue({ id: 5, protocol: "zkteco_adms", update });
    const req = mockRequest({ utilisateurRole: "admin", params: { id: "5" } } as any);
    const res: any = mockResponse();

    await PointageTerminalController.regenererToken(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.deviceToken).toMatch(/^ptk_[A-Za-z0-9_-]{43}$/);
    expect(update).toHaveBeenCalledWith({
      deviceTokenHash: PointageTerminalTokenService.hash(body.deviceToken)
    });
  });
});

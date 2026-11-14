import { mockRequest, mockResponse } from "../../helpers/express-mocks";

jest.mock("../../../core/helpers/DatabaseConnection", () => ({
  DatabaseConnection: {
    getInstance: jest.fn(),
  },
}));
jest.mock("../../../core/helpers/SurveillantSiteScope", () => ({
  getSurveillantSiteId: jest.fn(),
}));
jest.mock("../../../modules/inscription/services/CahierCohorteService", () => ({
  __esModule: true,
  default: { genererPourSite: jest.fn() },
}));

const { DatabaseConnection } = require("../../../core/helpers/DatabaseConnection");
const { getSurveillantSiteId } = require("../../../core/helpers/SurveillantSiteScope");
const CahierCohorteService = require("../../../modules/inscription/services/CahierCohorteService").default;
import CahiersCohorteController from "../../../modules/inscription/controllers/CahiersCohorteController";

describe("CahiersCohorteController.genererTous", () => {
  const transaction = {};
  const transactionRunner = jest.fn(async (callback: (transaction: object) => Promise<unknown>) => callback(transaction));

  beforeEach(() => {
    jest.clearAllMocks();
    DatabaseConnection.getInstance.mockReturnValue({ sequelize: { transaction: transactionRunner } });
    getSurveillantSiteId.mockResolvedValue(3);
    CahierCohorteService.genererPourSite.mockResolvedValue({
      cohortesTraitees: 2,
      listesPresencesCrees: 2,
      cahiersDeTexteCrees: 2,
    });
  });

  it("requires the supervisor role", async () => {
    const res = mockResponse();
    await CahiersCohorteController.genererTous(
      mockRequest({ utilisateurRole: "enseignant" } as any),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(CahierCohorteService.genererPourSite).not.toHaveBeenCalled();
  });

  it("generates both types of registers transactionally for the supervisor's active site", async () => {
    const res = mockResponse();
    await CahiersCohorteController.genererTous(
      mockRequest({ utilisateurRole: "surveillant", utilisateurId: 8 } as any),
      res,
    );

    expect(transactionRunner).toHaveBeenCalledTimes(1);
    expect(CahierCohorteService.genererPourSite).toHaveBeenCalledWith(3, transaction);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      cohortesTraitees: 2,
      listesPresencesCrees: 2,
      cahiersDeTexteCrees: 2,
    });
  });
});

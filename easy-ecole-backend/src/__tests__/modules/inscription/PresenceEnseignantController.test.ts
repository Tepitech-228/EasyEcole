import { mockRequest, mockResponse } from "../../helpers/express-mocks";

jest.mock("../../../core/helpers/DatabaseConnection");
jest.mock("../../../modules/inscription/models/Seance", () => ({
  Seance: {
    findByPk: jest.fn(),
    associations: { cours: "cours" },
  },
}));
jest.mock("../../../modules/inscription/models/ListePresence", () => ({
  ListePresence: { findOne: jest.fn(), associations: { presences: "presences" } },
}));
jest.mock("../../../modules/inscription/models/Presence", () => ({
  Presence: { associations: { presencesCoursParticipants: "presencesCoursParticipants" } },
}));
jest.mock("../../../modules/inscription/models/PresenceCoursParticipant", () => ({
  PresenceCoursParticipant: { associations: { coursParticipant: "coursParticipant" } },
}));
jest.mock("../../../modules/inscription/models/CoursParticipant", () => ({
  CoursParticipant: { associations: { utilisateur: "utilisateur", cursusApprenant: "cursusApprenant" } },
}));
jest.mock("../../../modules/auth/models/Utilisateur", () => ({
  Utilisateur: {},
}));
jest.mock("../../../modules/inscription/services/AutoPresenceService", () => ({
  AutoPresenceService: { genererPourSeance: jest.fn() },
}));
jest.mock("../../../core/helpers/SurveillantSiteScope", () => ({
  getSurveillantSiteId: jest.fn(),
}));

import PresenceEnseignantController from "../../../modules/inscription/controllers/PresenceEnseignantController";

const { Seance } = require("../../../modules/inscription/models/Seance");
const { ListePresence } = require("../../../modules/inscription/models/ListePresence");
const { getSurveillantSiteId } = require("../../../core/helpers/SurveillantSiteScope");

describe("PresenceEnseignantController site access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse au surveillant les présences d’une séance d’un autre site", async () => {
    getSurveillantSiteId.mockResolvedValue(3);
    Seance.findByPk.mockResolvedValue({
      id: 11,
      cours: { etablissementId: 4 },
    });
    const controller = new PresenceEnseignantController();
    const req = mockRequest({
      params: { seanceId: "11" },
      utilisateurRole: "surveillant",
      utilisateurId: 8,
      etablissementId: 3,
    } as any);
    const res = mockResponse();

    await controller.getPresencesParSeanceV2(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(ListePresence.findOne).not.toHaveBeenCalled();
  });
});

jest.mock("../../../modules/inscription/models/DossierEtudiant", () => ({}));
jest.mock("../../../modules/inscription/models/Echeance", () => ({}));
jest.mock("../../../modules/inscription/services/SnapshotService", () => ({
  SnapshotService: { deserialiser: jest.fn(() => null) }
}));

import SituationFinanciereService from "../../../modules/inscription/services/SituationFinanciereService";

describe("SituationFinanciereService", () => {
  it("returns inscription and tuition schedules separately for pointage display", () => {
    const situation = SituationFinanciereService.calculer({
      fraisScolarite: 90000,
      fraisScolariteSnapshot: null,
      echeances: [
        {
          id: 1,
          type: "inscription",
          numeroEcheance: 1,
          montant: 10000,
          montantPaye: 4000,
          dateLimite: new Date("2026-09-01"),
          moisConcerne: null,
          devise: "XAF",
          statut: "partiel"
        },
        {
          id: 2,
          type: "scolarite",
          numeroEcheance: 1,
          montant: 45000,
          montantPaye: 0,
          dateLimite: new Date("2026-10-01"),
          moisConcerne: "2026-10",
          devise: "XAF",
          statut: "impaye"
        }
      ]
    } as any);

    expect(situation.echeancesInscription).toHaveLength(1);
    expect(situation.echeancesInscription[0]).toEqual(expect.objectContaining({
      type: "inscription",
      montant: 10000,
      montantPaye: 4000,
      resteAPayer: 6000
    }));
    expect(situation.echeances.map(echeance => echeance.type)).toEqual(["scolarite"]);
  });
});

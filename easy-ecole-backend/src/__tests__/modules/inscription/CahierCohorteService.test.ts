jest.mock("../../../modules/inscription/models/Cours", () => ({
  Cours: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    associations: { parcours: "parcours" },
  },
}));
jest.mock("../../../modules/inscription/models/ListePresence", () => ({
  ListePresence: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../../../modules/inscription/models/CahierDeTexte", () => ({
  CahierDeTexte: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../../../modules/inscription/models/Parcours", () => ({
  Parcours: { associations: { niveauEtude: "niveauEtude" } },
}));

import CahierCohorteService from "../../../modules/inscription/services/CahierCohorteService";

const { Cours } = require("../../../modules/inscription/models/Cours");
const { ListePresence } = require("../../../modules/inscription/models/ListePresence");
const { CahierDeTexte } = require("../../../modules/inscription/models/CahierDeTexte");

const coursCohorte = (parcoursId: number, niveauId: number, etablissementId = 3) => ({
  parcoursId,
  etablissementId,
  parcours: {
    id: parcoursId,
    titre: `Filière ${parcoursId}`,
    niveauEtudeId: niveauId,
    niveauEtude: { id: niveauId, libelle: `Niveau ${niveauId}` },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  ListePresence.findOne.mockResolvedValue(null);
  CahierDeTexte.findOne.mockResolvedValue(null);
  ListePresence.create.mockResolvedValue({});
  CahierDeTexte.create.mockResolvedValue({});
});

describe("CahierCohorteService.genererPourSite", () => {
  it("creates both registers once per distinct filière and academic-level pair", async () => {
    Cours.findAll.mockResolvedValue([
      coursCohorte(4, 1),
      coursCohorte(4, 1),
      coursCohorte(5, 2),
      { parcoursId: 7, etablissementId: 3, parcours: null },
    ]);
    const transaction = { LOCK: { UPDATE: "UPDATE" } };

    await expect(CahierCohorteService.genererPourSite(3, transaction as any)).resolves.toEqual({
      cohortesTraitees: 2,
      listesPresencesCrees: 2,
      cahiersDeTexteCrees: 2,
    });

    expect(ListePresence.create).toHaveBeenCalledTimes(2);
    expect(CahierDeTexte.create).toHaveBeenCalledTimes(2);
    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { etablissementId: 3 } }),
    );
    expect(ListePresence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: "Filière 4 — Niveau 1",
        parcoursId: 4,
        niveauEtudeId: 1,
        etablissementId: 3,
        coursId: null,
        enseignantId: null,
      }),
      { transaction },
    );
    expect(CahierDeTexte.create).toHaveBeenCalledWith(
      expect.objectContaining({ parcoursId: 5, niveauEtudeId: 2, etablissementId: 3 }),
      { transaction },
    );
  });

  it("does not duplicate registers already generated for a cohort", async () => {
    Cours.findAll.mockResolvedValue([coursCohorte(4, 1)]);
    ListePresence.findOne.mockResolvedValue({ getDataValue: () => null });
    CahierDeTexte.findOne.mockResolvedValue({ getDataValue: () => null });

    await expect(CahierCohorteService.genererPourSite(3, { LOCK: { UPDATE: "UPDATE" } } as any))
      .resolves.toEqual({
        cohortesTraitees: 1,
        listesPresencesCrees: 0,
        cahiersDeTexteCrees: 0,
      });

    expect(ListePresence.create).not.toHaveBeenCalled();
    expect(CahierDeTexte.create).not.toHaveBeenCalled();
  });
});

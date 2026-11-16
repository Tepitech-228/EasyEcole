import { Op } from "sequelize";
import { ClasseOption } from "../../../core/enums/ClasseOption";

jest.mock("../../../modules/inscription/models/Cours", () => ({
  Cours: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    associations: { parcours: "parcours", classe: "classe" },
  },
}));
jest.mock("../../../modules/inscription/models/Classe", () => ({
  Classe: {
    findAll: jest.fn(),
    associations: { niveauEtude: "niveauEtude" },
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
const { Classe } = require("../../../modules/inscription/models/Classe");
const { ListePresence } = require("../../../modules/inscription/models/ListePresence");
const { CahierDeTexte } = require("../../../modules/inscription/models/CahierDeTexte");

const coursCohorte = (parcoursId: number, etablissementId: number | null, classeId: number | null = null) => ({
  parcoursId,
  etablissementId,
  classeId,
  parcours: {
    id: parcoursId,
    titre: `Filière ${parcoursId}`,
  },
});

const classeCohorte = (
  id: number,
  parcoursId: number,
  niveauEtudeId: number,
  option: "JOUR" | "SOIR" | "EN_LIGNE" | null,
  etablissementId: number | null = 3,
) => ({
  id,
  parcoursId,
  niveauEtudeId,
  option,
  etablissementId,
  niveauEtude: { id: niveauEtudeId, libelle: `L${niveauEtudeId}` },
});

beforeEach(() => {
  jest.clearAllMocks();
  Classe.findAll.mockResolvedValue([]);
  ListePresence.findOne.mockResolvedValue(null);
  CahierDeTexte.findOne.mockResolvedValue(null);
  ListePresence.create.mockResolvedValue({});
  CahierDeTexte.create.mockResolvedValue({});
});

describe("CahierCohorteService.genererPourSite", () => {
  it("includes global courses and creates separate registers by level and class option", async () => {
    Cours.findAll.mockResolvedValue([
      coursCohorte(4, null),
      coursCohorte(4, null),
      coursCohorte(5, 3),
      coursCohorte(7, null),
    ]);
    Classe.findAll.mockResolvedValue([
      classeCohorte(10, 4, 1, "JOUR"),
      classeCohorte(11, 4, 1, "SOIR"),
      classeCohorte(12, 4, 1, "JOUR"),
      classeCohorte(13, 5, 2, "EN_LIGNE"),
    ]);
    const transaction = { LOCK: { UPDATE: "UPDATE" } };

    await expect(CahierCohorteService.genererPourSite(3, transaction as any)).resolves.toEqual({
      cohortesTraitees: 3,
      listesPresencesCrees: 3,
      cahiersDeTexteCrees: 3,
    });

    expect(ListePresence.create).toHaveBeenCalledTimes(3);
    expect(CahierDeTexte.create).toHaveBeenCalledTimes(3);
    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { [Op.or]: [{ etablissementId: 3 }, { etablissementId: null }] },
        transaction,
      }),
    );
    expect(Classe.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        [Op.and]: expect.arrayContaining([
          { [Op.or]: [{ etablissementId: { [Op.in]: [3] } }, { etablissementId: null }] },
        ]),
      }),
      transaction,
    }));
    expect(ListePresence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: "Filière 4 — L1 — Jour",
        parcoursId: 4,
        niveauEtudeId: 1,
        etablissementId: 3,
        classeOption: "JOUR",
        coursId: null,
        enseignantId: null,
      }),
      { transaction },
    );
    expect(CahierDeTexte.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parcoursId: 4,
        niveauEtudeId: 1,
        etablissementId: 3,
        classeOption: "SOIR",
        titre: "Filière 4 — L1 — Soir",
      }),
      { transaction },
    );
    expect(CahierDeTexte.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parcoursId: 5,
        niveauEtudeId: 2,
        etablissementId: 3,
        classeOption: "EN_LIGNE",
      }),
      { transaction },
    );
  });

  it("does not duplicate registers already generated for a cohort", async () => {
    Cours.findAll.mockResolvedValue([coursCohorte(4, null)]);
    Classe.findAll.mockResolvedValue([classeCohorte(10, 4, 1, "JOUR", null)]);
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

  it("does not generate a register when a course has no matching site class", async () => {
    Cours.findAll.mockResolvedValue([coursCohorte(4, null)]);
    Classe.findAll.mockResolvedValue([classeCohorte(10, 4, 1, "JOUR", 9)]);

    await expect(CahierCohorteService.genererPourSite(3, { LOCK: { UPDATE: "UPDATE" } } as any))
      .resolves.toEqual({
        cohortesTraitees: 0,
        listesPresencesCrees: 0,
        cahiersDeTexteCrees: 0,
      });

    expect(ListePresence.create).not.toHaveBeenCalled();
    expect(CahierDeTexte.create).not.toHaveBeenCalled();
  });
});

describe("CahierCohorteService.trouverCoursIds", () => {
  it("includes global courses but excludes courses belonging to another class option", async () => {
    Cours.findAll.mockResolvedValue([
      { id: 1, classeId: null },
      { id: 2, classeId: 10, classe: { option: "JOUR" } },
      { id: 3, classeId: 11, classe: { option: "SOIR" } },
    ]);

    await expect(CahierCohorteService.trouverCoursIds({
      parcoursId: 4,
      niveauEtudeId: 1,
      etablissementId: 3,
      classeOption: ClasseOption.JOUR,
    })).resolves.toEqual([1, 2]);

    expect(Cours.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        parcoursId: 4,
        [Op.or]: [{ etablissementId: 3 }, { etablissementId: null }],
      },
      include: expect.arrayContaining([
        expect.objectContaining({ association: "classe", required: false }),
      ]),
    }));
  });
});

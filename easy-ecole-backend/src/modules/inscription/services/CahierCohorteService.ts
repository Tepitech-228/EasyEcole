import { Op, Transaction } from "sequelize";
import { Cours } from "../models/Cours";
import { CahierDeTexte } from "../models/CahierDeTexte";
import { ListePresence } from "../models/ListePresence";
import { Parcours } from "../models/Parcours";
import { Classe } from "../models/Classe";
import { ClasseOption } from "../../../core/enums/ClasseOption";

export interface CahierCohorte {
  parcoursId: number;
  niveauEtudeId: number;
  etablissementId: number;
  classeOption: ClasseOption | null;
  titreParcours: string;
  libelleNiveau: string;
}

export interface CahierEnseignementScope {
  coursId?: number | string | null;
  enseignantId?: number | string | null;
  parcoursId?: number | null;
  niveauEtudeId?: number | null;
  etablissementId?: number | null;
  classeOption?: ClasseOption | null;
}

export default class CahierCohorteService {
  static async trouverCohortes(
    etablissementId?: number,
    enseignantId?: number,
    transaction?: Transaction,
  ): Promise<CahierCohorte[]> {
    const whereCours: any = {};
    if (etablissementId !== undefined) {
      whereCours[Op.or] = [{ etablissementId }, { etablissementId: null }];
    }
    if (enseignantId !== undefined) whereCours.enseignantId = enseignantId;

    const cours = await Cours.findAll({
      attributes: ["parcoursId", "etablissementId", "classeId"],
      where: whereCours,
      include: [{
        association: Cours.associations.parcours,
        attributes: ["id", "titre"],
        required: true,
      }],
      ...(transaction ? { transaction } : {}),
    });

    const sourcesParSiteEtParcours = new Map<string, {
      etablissementId: number;
      parcoursId: number;
      titreParcours: string;
      coursSansClasse: boolean;
      classeIds: Set<number>;
    }>();
    for (const coursActuel of cours) {
      const parcours = coursActuel.parcours;
      const coursSiteId = etablissementId ?? Number(coursActuel.etablissementId);
      if (!parcours || !Number.isSafeInteger(coursSiteId) || coursSiteId <= 0) continue;

      const parcoursId = Number(parcours.id);
      const key = `${coursSiteId}:${parcoursId}`;
      const source = sourcesParSiteEtParcours.get(key) ?? {
        etablissementId: coursSiteId,
        parcoursId,
        titreParcours: parcours.titre,
        coursSansClasse: false,
        classeIds: new Set<number>(),
      };
      if (coursActuel.classeId == null) source.coursSansClasse = true;
      else source.classeIds.add(Number(coursActuel.classeId));
      sourcesParSiteEtParcours.set(key, source);
    }

    if (sourcesParSiteEtParcours.size === 0) return [];

    const sitesIds = [...new Set([...sourcesParSiteEtParcours.values()].map(source => source.etablissementId))];
    const parcoursIds = [...new Set([...sourcesParSiteEtParcours.values()].map(source => source.parcoursId))];
    const classeIds = [...new Set([...sourcesParSiteEtParcours.values()].flatMap(source => [...source.classeIds]))];
    const whereClasses: any = {
      [Op.and]: [
        { [Op.or]: [{ etablissementId: { [Op.in]: sitesIds } }, { etablissementId: null }] },
        { [Op.or]: [
          { parcoursId: { [Op.in]: parcoursIds } },
          ...(classeIds.length > 0 ? [{ id: { [Op.in]: classeIds } }] : []),
        ] },
      ],
    };
    const classes = await Classe.findAll({
      attributes: ["id", "parcoursId", "niveauEtudeId", "etablissementId", "option"],
      where: whereClasses,
      include: [{
        association: Classe.associations.niveauEtude,
        attributes: ["id", "libelle"],
        required: true,
      }],
      ...(transaction ? { transaction } : {}),
    });

    const cohortes = new Map<string, CahierCohorte>();
    for (const [key, source] of sourcesParSiteEtParcours) {
      for (const classe of classes) {
        if (classe.etablissementId != null && Number(classe.etablissementId) !== source.etablissementId) continue;
        const classeLieeAuParcours = Number(classe.parcoursId) === source.parcoursId;
        const classeLieeAuCours = source.classeIds.has(Number(classe.id));
        if ((!classeLieeAuParcours && !classeLieeAuCours) ||
            (!source.coursSansClasse && !classeLieeAuCours)) continue;

        const niveau = classe.niveauEtude;
        if (!niveau) continue;
        const classeOption = classe.option ?? null;
        const cohorte: CahierCohorte = {
          parcoursId: source.parcoursId,
          niveauEtudeId: Number(niveau.id),
          etablissementId: source.etablissementId,
          classeOption,
          titreParcours: source.titreParcours,
          libelleNiveau: niveau.libelle,
        };
        cohortes.set(
          `${key}:${cohorte.niveauEtudeId}:${cohorte.classeOption ?? "NON_DEFINI"}`,
          cohorte,
        );
      }
    }

    return [...cohortes.values()];
  }

  static async trouverCohortesPourCoursIds(coursIds: number[], etablissementId?: number): Promise<CahierCohorte[]> {
    if (coursIds.length === 0) return [];

    const cours = await Cours.findAll({
      attributes: ["parcoursId", "etablissementId", "classeId"],
      where: { id: { [Op.in]: coursIds } },
      include: [{
        association: Cours.associations.parcours,
        attributes: ["id", "titre"],
        required: true,
      }],
    });

    const sites = [...new Set([
      ...(etablissementId === undefined ? [] : [etablissementId]),
      ...cours.map(coursActuel => Number(coursActuel.etablissementId)).filter(id => id > 0),
    ])];
    const cohortes = await Promise.all(sites.map(siteId => this.trouverCohortes(siteId)));
    const classeIds = [...new Set(cours
      .map(coursActuel => Number(coursActuel.classeId))
      .filter(id => Number.isSafeInteger(id) && id > 0))];
    const classes = classeIds.length === 0 ? [] : await Classe.findAll({
      attributes: ["id", "option"],
      where: { id: { [Op.in]: classeIds } },
    });
    const optionParClasse = new Map(classes.map(classe => [Number(classe.id), classe.option ?? null]));
    return cohortes.flat().filter(cohorte => cours.some(coursActuel =>
      Number(coursActuel.parcoursId) === cohorte.parcoursId &&
      (coursActuel.etablissementId == null || Number(coursActuel.etablissementId) === cohorte.etablissementId) &&
      (coursActuel.classeId == null || optionParClasse.get(Number(coursActuel.classeId)) === cohorte.classeOption),
    ));
  }

  static conditionsPourCohortes(cohortes: CahierCohorte[]): Array<{
    parcoursId: number;
    niveauEtudeId: number;
    etablissementId: number;
    classeOption: ClasseOption | null;
  }> {
    return cohortes.map(({ parcoursId, niveauEtudeId, etablissementId, classeOption }) => ({
      parcoursId,
      niveauEtudeId,
      etablissementId,
      classeOption,
    }));
  }

  static async enseignantAssocieA(
    enseignantId: number,
    cohorte: Pick<CahierCohorte, "parcoursId" | "niveauEtudeId" | "etablissementId" | "classeOption">,
  ): Promise<boolean> {
    const cours = await Cours.findAll({
      attributes: ["id", "classeId"],
      where: {
        enseignantId,
        parcoursId: cohorte.parcoursId,
        [Op.or]: [{ etablissementId: cohorte.etablissementId }, { etablissementId: null }],
      },
      include: [{
        association: Cours.associations.parcours,
        attributes: [],
        required: true,
        where: { niveauEtudeId: cohorte.niveauEtudeId },
      }, {
        association: Cours.associations.classe,
        attributes: ["option"],
        required: false,
      }],
    });
    return cours.some(coursActuel =>
      coursActuel.classeId == null || coursActuel.classe?.option === cohorte.classeOption,
    );
  }

  static async enseignantAssocieAuCahier(
    enseignantId: number,
    cahier: CahierEnseignementScope,
  ): Promise<boolean> {
    if (cahier.parcoursId != null && cahier.niveauEtudeId != null && cahier.etablissementId != null) {
      return this.enseignantAssocieA(enseignantId, {
        parcoursId: Number(cahier.parcoursId),
        niveauEtudeId: Number(cahier.niveauEtudeId),
        etablissementId: Number(cahier.etablissementId),
        classeOption: cahier.classeOption ?? null,
      });
    }

    if (cahier.enseignantId != null && Number(cahier.enseignantId) === enseignantId) {
      return true;
    }

    if (cahier.coursId == null) return false;
    const cours = await Cours.findOne({
      attributes: ["id"],
      where: { id: Number(cahier.coursId), enseignantId },
    });
    return cours !== null;
  }

  static async trouverCoursIdsPourCahier(cahier: CahierEnseignementScope): Promise<number[]> {
    if (cahier.parcoursId != null && cahier.niveauEtudeId != null && cahier.etablissementId != null) {
      return this.trouverCoursIds({
        parcoursId: Number(cahier.parcoursId),
        niveauEtudeId: Number(cahier.niveauEtudeId),
        etablissementId: Number(cahier.etablissementId),
        classeOption: cahier.classeOption ?? null,
      });
    }

    return cahier.coursId == null ? [] : [Number(cahier.coursId)];
  }

  static async trouverCoursIds(
    cohorte: Pick<CahierCohorte, "parcoursId" | "niveauEtudeId" | "etablissementId" | "classeOption">,
    transaction?: Transaction,
  ): Promise<number[]> {
    const cours = await Cours.findAll({
      attributes: ["id", "classeId"],
      where: {
        parcoursId: cohorte.parcoursId,
        [Op.or]: [{ etablissementId: cohorte.etablissementId }, { etablissementId: null }],
      },
      include: [{
        association: Cours.associations.parcours,
        attributes: [],
        required: true,
        where: { niveauEtudeId: cohorte.niveauEtudeId },
      }, {
        association: Cours.associations.classe,
        attributes: ["option"],
        required: false,
      }],
      ...(transaction ? { transaction } : {}),
    });
    return cours
      .filter(item => item.classeId == null || item.classe?.option === cohorte.classeOption)
      .map(item => Number(item.id));
  }

  static async genererPourSite(
    etablissementId: number,
    transaction: Transaction,
  ): Promise<{ cohortesTraitees: number; listesPresencesCrees: number; cahiersDeTexteCrees: number }> {
    const cohortes = await this.trouverCohortes(etablissementId, undefined, transaction);
    let listesPresencesCrees = 0;
    let cahiersDeTexteCrees = 0;

    for (const cohorte of cohortes) {
      const scope = {
        parcoursId: cohorte.parcoursId,
        niveauEtudeId: cohorte.niveauEtudeId,
        etablissementId: cohorte.etablissementId,
        classeOption: cohorte.classeOption,
      };
      const titre = `${cohorte.titreParcours} — ${cohorte.libelleNiveau} — ${this.libelleOption(cohorte.classeOption)}`;

      const listeExistante = await ListePresence.findOne({
        where: scope,
        paranoid: false,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (listeExistante) {
        if (listeExistante.getDataValue("deletedAt")) {
          await listeExistante.restore({ transaction });
        }
      } else {
        await ListePresence.create({
          ...scope,
          classeOption: cohorte.classeOption,
          titre,
          description: "Cahier de présence partagé par filière, niveau et régime.",
          coursId: null,
          enseignantId: null,
        }, { transaction });
        listesPresencesCrees += 1;
      }

      const cahierExistant = await CahierDeTexte.findOne({
        where: scope,
        paranoid: false,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (cahierExistant) {
        if (cahierExistant.getDataValue("deletedAt")) {
          await cahierExistant.restore({ transaction });
        }
      } else {
        await CahierDeTexte.create({
          ...scope,
          classeOption: cohorte.classeOption,
          titre,
          description: "Cahier de texte partagé par filière, niveau et régime.",
          coursId: null,
          enseignantId: null,
        }, { transaction });
        cahiersDeTexteCrees += 1;
      }
    }

    return { cohortesTraitees: cohortes.length, listesPresencesCrees, cahiersDeTexteCrees };
  }

  private static libelleOption(option: ClasseOption | null): string {
    switch (option) {
      case ClasseOption.JOUR: return "Jour";
      case ClasseOption.SOIR: return "Soir";
      case ClasseOption.EN_LIGNE: return "En ligne";
      default: return "Régime non défini";
    }
  }
}

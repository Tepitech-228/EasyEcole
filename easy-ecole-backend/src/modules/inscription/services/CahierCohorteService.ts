import { Op, Transaction } from "sequelize";
import { Cours } from "../models/Cours";
import { CahierDeTexte } from "../models/CahierDeTexte";
import { ListePresence } from "../models/ListePresence";
import { Parcours } from "../models/Parcours";

export interface CahierCohorte {
  parcoursId: number;
  niveauEtudeId: number;
  etablissementId: number;
  titreParcours: string;
  libelleNiveau: string;
}

export interface CahierEnseignementScope {
  coursId?: number | string | null;
  enseignantId?: number | string | null;
  parcoursId?: number | null;
  niveauEtudeId?: number | null;
  etablissementId?: number | null;
}

export default class CahierCohorteService {
  static async trouverCohortes(
    etablissementId?: number,
    enseignantId?: number,
    transaction?: Transaction,
  ): Promise<CahierCohorte[]> {
    const cours = await Cours.findAll({
      attributes: ["parcoursId", "etablissementId"],
      where: {
        ...(etablissementId === undefined ? {} : { etablissementId }),
        ...(enseignantId === undefined ? {} : { enseignantId }),
      },
      include: [{
        association: Cours.associations.parcours,
        attributes: ["id", "titre", "niveauEtudeId"],
        required: true,
        where: { niveauEtudeId: { [Op.ne]: null } },
        include: [{
          association: Parcours.associations.niveauEtude,
          attributes: ["id", "libelle"],
          required: true,
        }],
      }],
      ...(transaction ? { transaction } : {}),
    });

    const cohortes = new Map<string, CahierCohorte>();
    for (const coursActuel of cours) {
      const parcours = coursActuel.parcours;
      const niveau = parcours?.niveauEtude;
      if (!parcours || !niveau || !coursActuel.etablissementId) continue;

      const cohorte: CahierCohorte = {
        parcoursId: Number(parcours.id),
        niveauEtudeId: Number(niveau.id),
        etablissementId: Number(coursActuel.etablissementId),
        titreParcours: parcours.titre,
        libelleNiveau: niveau.libelle,
      };
      cohortes.set(
        `${cohorte.etablissementId}:${cohorte.parcoursId}:${cohorte.niveauEtudeId}`,
        cohorte,
      );
    }

    return [...cohortes.values()];
  }

  static async trouverCohortesPourCoursIds(coursIds: number[]): Promise<CahierCohorte[]> {
    if (coursIds.length === 0) return [];

    const cours = await Cours.findAll({
      attributes: ["parcoursId", "etablissementId"],
      where: { id: { [Op.in]: coursIds } },
      include: [{
        association: Cours.associations.parcours,
        attributes: ["id", "titre", "niveauEtudeId"],
        required: true,
        where: { niveauEtudeId: { [Op.ne]: null } },
        include: [{
          association: Parcours.associations.niveauEtude,
          attributes: ["id", "libelle"],
          required: true,
        }],
      }],
    });

    const cohortes = new Map<string, CahierCohorte>();
    for (const coursActuel of cours) {
      const parcours = coursActuel.parcours;
      const niveau = parcours?.niveauEtude;
      if (!parcours || !niveau || !coursActuel.etablissementId) continue;

      const cohorte: CahierCohorte = {
        parcoursId: Number(parcours.id),
        niveauEtudeId: Number(niveau.id),
        etablissementId: Number(coursActuel.etablissementId),
        titreParcours: parcours.titre,
        libelleNiveau: niveau.libelle,
      };
      cohortes.set(
        `${cohorte.etablissementId}:${cohorte.parcoursId}:${cohorte.niveauEtudeId}`,
        cohorte,
      );
    }

    return [...cohortes.values()];
  }

  static conditionsPourCohortes(cohortes: CahierCohorte[]): Array<{
    parcoursId: number;
    niveauEtudeId: number;
    etablissementId: number;
  }> {
    return cohortes.map(({ parcoursId, niveauEtudeId, etablissementId }) => ({
      parcoursId,
      niveauEtudeId,
      etablissementId,
    }));
  }

  static async enseignantAssocieA(
    enseignantId: number,
    cohorte: Pick<CahierCohorte, "parcoursId" | "niveauEtudeId" | "etablissementId">,
  ): Promise<boolean> {
    const cours = await Cours.findOne({
      attributes: ["id"],
      where: {
        enseignantId,
        parcoursId: cohorte.parcoursId,
        etablissementId: cohorte.etablissementId,
      },
      include: [{
        association: Cours.associations.parcours,
        attributes: [],
        required: true,
        where: { niveauEtudeId: cohorte.niveauEtudeId },
      }],
    });
    return cours !== null;
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
      });
    }

    return cahier.coursId == null ? [] : [Number(cahier.coursId)];
  }

  static async trouverCoursIds(
    cohorte: Pick<CahierCohorte, "parcoursId" | "niveauEtudeId" | "etablissementId">,
    transaction?: Transaction,
  ): Promise<number[]> {
    const cours = await Cours.findAll({
      attributes: ["id"],
      where: {
        parcoursId: cohorte.parcoursId,
        etablissementId: cohorte.etablissementId,
      },
      include: [{
        association: Cours.associations.parcours,
        attributes: [],
        required: true,
        where: { niveauEtudeId: cohorte.niveauEtudeId },
      }],
      ...(transaction ? { transaction } : {}),
    });
    return cours.map(item => Number(item.id));
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
      };
      const titre = `${cohorte.titreParcours} — ${cohorte.libelleNiveau}`;

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
          titre,
          description: "Cahier de présence partagé par filière et niveau.",
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
          titre,
          description: "Cahier de texte partagé par filière et niveau.",
          coursId: null,
          enseignantId: null,
        }, { transaction });
        cahiersDeTexteCrees += 1;
      }
    }

    return { cohortesTraitees: cohortes.length, listesPresencesCrees, cahiersDeTexteCrees };
  }
}

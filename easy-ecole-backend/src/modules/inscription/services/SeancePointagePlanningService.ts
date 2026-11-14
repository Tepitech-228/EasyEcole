import { Op, Transaction } from "sequelize";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Seance } from "../models/Seance";

export interface NavigationProchainCours {
  siteActuel: string;
  prochainCours: {
    site: string;
    heureDebut: string;
    salle: string | null;
    etage: string | null;
    memeSite: boolean;
  } | null;
}

function secondesDepuisHeure(value: unknown): number | null {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  const match = text.match(/(?:^|T)([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0);
}

function heurePointage(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  const match = text.match(/(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?/);
  return match ? `${match[1]}:${match[2]}:${match[3] || "00"}` : "";
}

export default class SeancePointagePlanningService {
  static async trouverCoursSuivant(
    enseignantId: number,
    etablissementId: number,
    date: string,
    heureApres: string,
    seanceActuelleId: number,
    transaction?: Transaction
  ): Promise<NavigationProchainCours> {
    const siteActuel = await Etablissement.findByPk(etablissementId, {
      attributes: ["nom"],
      ...(transaction ? { transaction } : {})
    });
    if (!siteActuel) {
      throw new Error(`Le site ${etablissementId} du pointage de séance est introuvable.`);
    }

    const dateValue = new Date(`${date}T00:00:00.000Z`);
    const heureApresSecondes = secondesDepuisHeure(heureApres);
    if (
      Number.isNaN(dateValue.getTime())
      || dateValue.toISOString().slice(0, 10) !== date
      || heureApresSecondes === null
    ) {
      throw new Error("La date ou l’heure du pointage de séance est invalide.");
    }

    const jour = String(dateValue.getUTCDay() || 7) as JoursSemaine;
    const seances = await Seance.findAll({
      where: {
        enseignantId,
        etablissementId: { [Op.ne]: null },
        id: { [Op.ne]: seanceActuelleId },
        jourSemaine: jour,
        dateDebut: { [Op.lte]: date },
        dateFin: { [Op.gte]: date },
        publieeLe: { [Op.ne]: null }
      },
      include: [
        { association: Seance.associations.salleDeClasse, attributes: ["libelle", "etage"], required: false },
        { association: Seance.associations.etablissement, attributes: ["id", "nom"], required: true }
      ],
      order: [["heureDebut", "ASC"]],
      ...(transaction ? { transaction } : {})
    });

    const seancesSuivantes = seances.filter(seance => {
      const heureDebut = secondesDepuisHeure(seance.heureDebut);
      return heureDebut !== null && heureDebut >= heureApresSecondes;
    });
    const prochainCoursMemeSite = seancesSuivantes.find(
      seance => Number(seance.etablissementId) === etablissementId
    );
    const prochainCours = prochainCoursMemeSite
      || seancesSuivantes.find(seance => Number(seance.etablissementId) !== etablissementId);

    if (!prochainCours) {
      return { siteActuel: siteActuel.nom, prochainCours: null };
    }

    const heureDebut = heurePointage(prochainCours.heureDebut);
    if (!heureDebut || !prochainCours.etablissement?.nom) {
      throw new Error("Les informations du prochain cours ou de son site sont incomplètes.");
    }

    return {
      siteActuel: siteActuel.nom,
      prochainCours: {
        site: prochainCours.etablissement.nom,
        heureDebut,
        salle: prochainCours.salleDeClasse?.libelle || prochainCours.salle || null,
        etage: prochainCours.salleDeClasse?.etage || null,
        memeSite: Number(prochainCours.etablissementId) === etablissementId
      }
    };
  }
}

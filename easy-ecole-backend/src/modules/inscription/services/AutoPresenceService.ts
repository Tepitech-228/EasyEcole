import { Op } from "sequelize";
import { Seance } from "../models/Seance";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";

export class AutoPresenceService {

  static async genererPourSeance(seanceId: number): Promise<{ listePresence: ListePresence; presences: Presence[] }> {
    const seance = await Seance.findByPk(seanceId, {
      include: [{ association: Seance.associations.cours }]
    });
    if (!seance) throw new Error('Séance non trouvée');

    const existingListe = await ListePresence.findOne({
      include: [{
        association: ListePresence.associations.presences,
        required: true,
        where: {
          date: seance.dateDebut,
          heureDebut: seance.heureDebut
        }
      }],
      where: { coursId: seance.coursId as any }
    });
    if (existingListe) {
      throw new Error('Une liste de présence existe déjà pour cette séance');
    }

    const coursParticipants = await CoursParticipant.findAll({
      where: { coursId: seance.coursId as any }
    });
    if (!coursParticipants.length) {
      throw new Error('Aucun participant inscrit à ce cours');
    }

    const listePresence = await ListePresence.create({
      titre: `Présences - ${(seance as any).cours?.intitule || 'Cours'} - ${seance.dateDebut}`,
      description: `Généré automatiquement depuis la séance du ${seance.dateDebut}`,
      coursId: seance.coursId as any,
      enseignantId: seance.enseignantId as any
    });

    const presence = await Presence.create({
      date: seance.dateDebut,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      listePresenceId: listePresence.id as any
    });

    const pcpData = coursParticipants.map(cp => ({
      presenceId: presence.id as any,
      coursParticipantId: cp.id as any,
      etatDePresence: EtatsDePresence.NON_RENSEIGNE as any
    }));
    await PresenceCoursParticipant.bulkCreate(pcpData);

    return { listePresence, presences: [presence] };
  }

  static async genererPourToutesSeancesDuJour(date: string): Promise<{ total: number; reussies: number; erreurs: string[] }> {
    const seances = await Seance.findAll({
      where: { dateDebut: date }
    });

    let reussies = 0;
    const erreurs: string[] = [];
    for (const seance of seances) {
      try {
        await AutoPresenceService.genererPourSeance(Number(seance.id));
        reussies++;
      } catch (e: any) {
        erreurs.push(`Séance #${seance.id}: ${e.message}`);
      }
    }
    return { total: seances.length, reussies, erreurs };
  }
}

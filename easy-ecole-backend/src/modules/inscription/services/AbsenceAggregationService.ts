import { Op } from "sequelize";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { Presence } from "../models/Presence";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";

export interface AbsenceAggregate {
  cursusApprenantId: number
  utilisateurId: number
  nom: string
  prenoms: string
  matricule: string
  totalSeances: number
  presences: number
  absences: number
  absencesJustifiees: number
  nonRenseignes: number
  tauxAbsence: number
}

export interface AbsenceDetail {
  id: number
  date: string
  heureDebut: string
  heureFin: string
  cours: string
  etat: string
}

export class AbsenceAggregationService {

  static async getAbsencesByCursus(cursusApprenantId: number, coursId?: number): Promise<AbsenceDetail[]> {
    const where: any = {};
    if (coursId) {
      const cpIds = await CoursParticipant.findAll({
        where: { cursusApprenantId, coursId },
        attributes: ['id']
      });
      where.coursParticipantId = { [Op.in]: cpIds.map(c => c.id) };
    } else {
      const cpIds = await CoursParticipant.findAll({
        where: { cursusApprenantId },
        attributes: ['id']
      });
      where.coursParticipantId = { [Op.in]: cpIds.map(c => c.id) };
    }

    const pcps = await PresenceCoursParticipant.findAll({
      where,
      include: [
        {
          association: PresenceCoursParticipant.associations.presence,
          include: [{
            association: Presence.associations.listePresence,
            include: [{ association: 'cours', attributes: ['intitule'] }]
          }]
        },
        {
          association: PresenceCoursParticipant.associations.coursParticipant,
          include: [
            { association: CoursParticipant.associations.utilisateur, attributes: ['nom', 'prenoms', 'matricule'] }
          ]
        }
      ],
      order: [[{ model: Presence, as: 'presence' }, 'date', 'DESC']]
    });

    return pcps.map(pcp => ({
      id: Number((pcp as any).id),
      date: (pcp as any).presence?.date || '',
      heureDebut: (pcp as any).presence?.heureDebut || '',
      heureFin: (pcp as any).presence?.heureFin || '',
      cours: (pcp as any).presence?.listePresence?.cours?.intitule || '',
      etat: pcp.etatDePresence
    }));
  }

  static async getAggregateByCursus(cursusApprenantId: number): Promise<AbsenceAggregate | null> {
    const cp = await CoursParticipant.findOne({
      where: { cursusApprenantId },
      include: [{ association: CoursParticipant.associations.utilisateur }]
    });
    if (!cp) return null;

    const pcps = await PresenceCoursParticipant.findAll({
      where: { coursParticipantId: cp.id as any },
      include: [{ association: PresenceCoursParticipant.associations.presence }]
    });

    const total = pcps.length;
    const presences = pcps.filter(p => p.etatDePresence === EtatsDePresence.PRESENT).length;
    const absences = pcps.filter(p => p.etatDePresence === EtatsDePresence.ABSENT).length;
    const justifiees = pcps.filter(p => p.etatDePresence === EtatsDePresence.ABSENCE_JUSTIFIEE).length;
    const nonRenseignes = pcps.filter(p => p.etatDePresence === EtatsDePresence.NON_RENSEIGNE).length;

    return {
      cursusApprenantId,
      utilisateurId: Number(cp.utilisateurId),
      nom: (cp as any).utilisateur?.nom || '',
      prenoms: (cp as any).utilisateur?.prenoms || '',
      matricule: (cp as any).utilisateur?.matricule || '',
      totalSeances: total,
      presences,
      absences,
      absencesJustifiees: justifiees,
      nonRenseignes,
      tauxAbsence: total > 0 ? ((absences / total) * 100) : 0
    };
  }

  static async getAggregateByClasse(classeId: number, anneeAcademiqueId: number): Promise<AbsenceAggregate[]> {
    const coursParticipants = await CoursParticipant.findAll({
      include: [
        {
          association: CoursParticipant.associations.cursusApprenant,
          where: { classeId, anneeAcademiqueId },
          required: true
        },
        { association: CoursParticipant.associations.utilisateur }
      ]
    });

    const results: AbsenceAggregate[] = [];
    for (const cp of coursParticipants) {
      const agg = await AbsenceAggregationService.getAggregateByCursus(Number((cp as any).cursusApprenant?.id));
      if (agg) results.push(agg);
    }
    return results;
  }
}

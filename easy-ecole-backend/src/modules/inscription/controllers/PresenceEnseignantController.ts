import { Request, Response } from "express";
import { Op } from "sequelize";
import { Seance } from "../models/Seance";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";
import { AutoPresenceService } from "../services/AutoPresenceService";

export default class PresenceEnseignantController {

  async getPresencesParSeance(req: Request, res: Response) {
    try {
      const seanceId = req.params.seanceId;

      const liste = await ListePresence.findOne({
        include: [{
          association: ListePresence.associations.presences,
          required: true,
          include: [{
            association: Presence.associations.presencesCoursParticipants,
            required: true,
            include: [{
              association: PresenceCoursParticipant.associations.coursParticipant,
              required: true,
              include: [
                { association: CoursParticipant.associations.utilisateur },
                { association: CoursParticipant.associations.cursusApprenant }
              ]
            }]
          }]
        }],
        where: { '$presences.listePresenceId$': { [Op.col]: 'ListePresence.id' } }
      });

      if (!liste) {
        return res.status(404).json({ message: 'Aucune liste de présence trouvée pour cette séance. Générez-la d\'abord.' });
      }

      return res.json(liste);
    } catch (error) {
      console.error('Erreur récupération présences:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async getPresencesParSeanceV2(req: Request, res: Response) {
    try {
      const seanceId = req.params.seanceId;
      const seance = await Seance.findByPk(seanceId, {
        include: [{ association: Seance.associations.cours }]
      });
      if (!seance) return res.status(404).json({ message: 'Séance non trouvée' });

      const liste = await ListePresence.findOne({
        where: { coursId: seance.coursId as any },
        include: [{
          association: ListePresence.associations.presences,
          where: { date: seance.dateDebut, heureDebut: seance.heureDebut },
          required: true,
          include: [{
            association: Presence.associations.presencesCoursParticipants,
            required: true,
            include: [{
              association: PresenceCoursParticipant.associations.coursParticipant,
              required: true,
              include: [
                { association: CoursParticipant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'matricule'] },
                { association: CoursParticipant.associations.cursusApprenant, attributes: ['id'] }
              ]
            }]
          }]
        }]
      });

      if (!liste) {
        return res.json({ seance, presences: [], message: 'Générer les présences d\'abord' });
      }

      const presences = (liste as any).presences || [];
      const participants = presences.flatMap((p: any) =>
        (p.presencesCoursParticipants || []).map((pcp: any) => ({
          id: pcp.id,
          presenceId: p.id,
          etatDePresence: pcp.etatDePresence,
          participant: {
            id: pcp.coursParticipant?.id,
            nom: pcp.coursParticipant?.utilisateur?.nom,
            prenoms: pcp.coursParticipant?.utilisateur?.prenoms,
            matricule: pcp.coursParticipant?.utilisateur?.matricule,
            cursusApprenantId: pcp.coursParticipant?.cursusApprenant?.id
          }
        }))
      );

      return res.json({ seance, participants });
    } catch (error) {
      console.error('Erreur récupération présences:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async genererPresencesPourSeance(req: Request, res: Response) {
    try {
      const seanceId = parseInt(req.params.seanceId);
      const result = await AutoPresenceService.genererPourSeance(seanceId);
      return res.status(201).json({ message: 'Présences générées avec succès', ...result });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async mettreAJourEtatPresence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { etatDePresence } = req.body;

      const valides = [EtatsDePresence.PRESENT, EtatsDePresence.ABSENT, EtatsDePresence.ABSENCE_JUSTIFIEE, EtatsDePresence.NON_RENSEIGNE];
      if (!valides.includes(etatDePresence)) {
        return res.status(400).json({ message: `État invalide. Valeurs: ${valides.join(', ')}` });
      }

      const pcp = await PresenceCoursParticipant.findByPk(id);
      if (!pcp) {
        return res.status(404).json({ message: 'Présence participant non trouvée' });
      }

      await pcp.update({ etatDePresence });
      return res.json(pcp);
    } catch (error) {
      console.error('Erreur mise à jour présence:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }

  async mettreAJourMassive(req: Request, res: Response) {
    try {
      const { seanceId, etats } = req.body;
      if (!seanceId || !etats || !Array.isArray(etats)) {
        return res.status(400).json({ message: 'seanceId et etats requis' });
      }

      const seance = await Seance.findByPk(seanceId);
      if (!seance) return res.status(404).json({ message: 'Séance non trouvée' });

      let count = 0;
      for (const e of etats) {
        const valides = [EtatsDePresence.PRESENT, EtatsDePresence.ABSENT, EtatsDePresence.ABSENCE_JUSTIFIEE, EtatsDePresence.NON_RENSEIGNE];
        if (valides.includes(e.etatDePresence) && e.id) {
          await (PresenceCoursParticipant as any).update({ etatDePresence: e.etatDePresence }, { where: { id: e.id } });
          count++;
        }
      }

      return res.json({ message: `${count} présence(s) mise(s) à jour` });
    } catch (error) {
      console.error('Erreur mise à jour massive:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }
}

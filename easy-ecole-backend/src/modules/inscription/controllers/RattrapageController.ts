import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { RattrapageInscription } from "../models/RattrapageInscription";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { Cours } from "../models/Cours";
import { SessionExamen } from "../models/SessionExamen";
import { Mcc } from "../models/Mcc";
import { Seance } from "../models/Seance";
import { Bulletin } from "../../bulletins/models/Bulletin";
import { LigneBulletin } from "../../bulletins/models/LigneBulletin";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Notification } from "../../elearning/models/Notification";

export default class RattrapageController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.sessionExamenId) where.sessionExamenId = req.query.sessionExamenId;
      if (req.query.coursId) where.coursId = req.query.coursId;
      if (req.query.statut) where.statut = req.query.statut;

      const data = await RattrapageInscription.findAll({
        where,
        include: [
          { association: RattrapageInscription.associations.coursParticipant, include: [{ all: true }] },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen, include: [{ all: true }] }
        ]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RattrapageInscription.findByPk(req.params.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant, include: [{ all: true }] },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen, include: [{ all: true }] }
        ]
      });
      if (!data) return res.status(404).json({ success: false, message: "Inscription rattrapage non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const data = await RattrapageInscription.create(req.body);
      const full = await RattrapageInscription.findByPk(data.id, {
        include: [{ all: true }]
      });
      return res.status(201).send(full);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const data = await RattrapageInscription.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Inscription rattrapage non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const data = await RattrapageInscription.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Inscription rattrapage non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async assignerAuto(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const { sessionExamenId, classeId, semestre, anneeAcademiqueId } = req.body;

      if (!sessionExamenId || !classeId || !semestre) {
        return res.status(400).json({ success: false, message: "sessionExamenId, classeId, semestre requis" });
      }

      const sessionExamen = await SessionExamen.findByPk(sessionExamenId);
      if (!sessionExamen) return res.status(404).json({ success: false, message: "Session examen non trouvée" });

      const bulletins = await Bulletin.findAll({
        where: { classeId, semestre, anneeAcademiqueId },
        include: [
          { association: Bulletin.associations.cursusApprenant, include: [{ all: true }] },
          { association: Bulletin.associations.lignesBulletins }
        ]
      });

      const coursIds = await Cours.findAll({
        where: { classeId, semestre },
        attributes: ['id']
      }).then(rows => rows.map(r => r.id));

      const created: any[] = [];

      for (const bulletin of bulletins) {
        if (!bulletin.lignesBulletins) continue;

        for (const ligne of bulletin.lignesBulletins) {
          if ((ligne.moyenne ?? 0) < 10) {
            const coursParticipant = await CoursParticipant.findOne({
              where: { coursId: ligne.coursId, cursusApprenantId: bulletin.cursusApprenantId }
            });
            if (!coursParticipant) continue;

            const existant = await RattrapageInscription.findOne({
              where: {
                coursParticipantId: coursParticipant.id,
                sessionExamenId
              }
            });
            if (existant) continue;

            const rattrapage = await RattrapageInscription.create({
              coursParticipantId: coursParticipant.id,
              coursId: ligne.coursId,
              sessionExamenId,
              statut: 'inscrit'
            });

            const full = await RattrapageInscription.findByPk(rattrapage.id, {
              include: [
                { association: RattrapageInscription.associations.coursParticipant, include: [{ all: true }] },
                { association: RattrapageInscription.associations.cours },
                { association: RattrapageInscription.associations.sessionExamen }
              ]
            });
            created.push(full);
          }
        }
      }

      return res.status(201).json({ success: true, count: created.length, data: created });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getSessions(req: Request, res: Response): Promise<Response> {
    try {
      const data = await SessionExamen.findAll({
        where: { type: 'rattrapage' },
        include: [
          { association: SessionExamen.associations.classe },
          { association: SessionExamen.associations.anneeAcademique }
        ],
        order: [['dateDebut', 'DESC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionExamenId } = req.query;
      const where: any = {};
      if (sessionExamenId) where.sessionExamenId = sessionExamenId;

      const total = await RattrapageInscription.count({ where });
      const inscrits = await RattrapageInscription.count({ where: { ...where, statut: 'inscrit' } });
      const convoques = await RattrapageInscription.count({ where: { ...where, statut: 'convoque' } });
      const presents = await RattrapageInscription.count({ where: { ...where, statut: 'present' } });
      const absents = await RattrapageInscription.count({ where: { ...where, statut: 'absent' } });
      const valides = await RattrapageInscription.count({ where: { ...where, statut: 'valide' } });
      const avecNote = await RattrapageInscription.count({ where: { ...where, noteRattrapage: { [Op.ne]: null } } });

      return res.json({ total, inscrits, convoques, presents, absents, valides, avecNote });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async saveNotes(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const { notes } = req.body;

      if (!Array.isArray(notes)) {
        return res.status(400).json({ success: false, message: "notes doit être un tableau" });
      }

      const results: any[] = [];
      for (const item of notes) {
        const rattrapage = await RattrapageInscription.findByPk(item.id);
        if (!rattrapage) continue;

        await rattrapage.update({
          noteRattrapage: item.noteRattrapage ?? null,
          statut: item.noteRattrapage != null ? 'valide' : rattrapage.statut
        });

        results.push(rattrapage);
      }

      return res.json({ success: true, count: results.length });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async notifierEtudiants(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const rattrapages = await RattrapageInscription.findAll({
        where: { id: { [Op.in]: Array.isArray(req.body.ids) ? req.body.ids : [] } },
        include: [
          {
            association: RattrapageInscription.associations.coursParticipant,
            include: [{ association: CoursParticipant.associations.utilisateur }]
          },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
        ]
      });

      if (!rattrapages.length) {
        return res.status(400).json({ success: false, message: "Aucun rattrapage à notifier" });
      }

      const sender = EmailSender.getInstance();
      let envoye = 0;

      for (const r of rattrapages) {
        const user = (r as any).coursParticipant?.utilisateur as Utilisateur | undefined;
        if (!user || !user.email) continue;

        const cours = (r as any).cours as Cours | undefined;
        const session = (r as any).sessionExamen as SessionExamen | undefined;

        try {
          await sender.sendMail({
            from: `Easy Ecole <easy.ecole@technologybusiness-tb.com>`,
            to: user.email,
            encoding: 'UTF-8',
            subject: 'Session de rattrapage ouverte',
            html: `<p>Bonjour <b>${user.prenoms} ${user.nom},</b></p>
            <p>Une session de rattrapage vous a été attribuée.</p>
            <p><b>Matière :</b> ${cours?.intitule || cours?.code || ''}<br>
            <b>Session :</b> ${session?.libelle || ''}<br>
            ${r.dateRattrapage ? `<b>Date :</b> ${new Date(r.dateRattrapage).toLocaleDateString('fr-FR')}<br>` : ''}
            ${r.salle ? `<b>Salle :</b> ${r.salle}<br>` : ''}
            ${r.heureDebut ? `<b>Heure :</b> ${r.heureDebut}` : ''}</p>
            <p>Veuillez vous préparer en conséquence.</p>
            <p>Cordialement,<br>Easy Ecole</p>`
          });

          await r.update({ notificationEnvoyee: true });

          try {
            await Notification.create({
              utilisateurId: user.id,
              type: 'rattrapage',
              message: `Rattrapage ouvert pour ${cours?.intitule || cours?.code || ''} - ${session?.libelle || ''}`,
              date: new Date()
            } as any);
          } catch (_) {}

          envoye++;
        } catch (_) {}
      }

      return res.json({ success: true, envoye, total: rattrapages.length });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getProchainCoursEnseignant(req: Request, res: Response): Promise<Response> {
    try {
      const utilisateurId = (req as any).utilisateurId;
      const role = (req as any).utilisateurRole;

      if (role !== RolesUtilisateur.ENSEIGNANT && role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ADMIN) {
        return res.status(403).json({ success: false, message: "Accès réservé aux enseignants" });
      }

      let enseignantId: number | null = null;
      if (role === RolesUtilisateur.ENSEIGNANT) {
        const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
        if (enseignant) enseignantId = enseignant.id as unknown as number;
      }

      const now = new Date();
      const in10Min = new Date(now.getTime() + 10 * 60000);
      const currentTime = now.toTimeString().slice(0, 5);
      const endTime = in10Min.toTimeString().slice(0, 5);
      const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
      const today = dayNames[now.getDay()];

      const seances = await Seance.findAll({
        where: {
          ...(enseignantId ? { enseignantId } : {}),
          jourSemaine: today as any,
          dateDebut: { [Op.lte]: now },
          dateFin: { [Op.gte]: now },
          [Op.and]: [
            literal(`heureDebut >= '${currentTime}:00' AND heureDebut < '${endTime}:59'`)
          ]
        },
        include: [
          { association: Seance.associations.cours },
          { association: Seance.associations.enseignant, include: [{ association: Enseignant.associations.utilisateur }] }
        ]
      });

      if (seances.length === 0) {
        return res.json({ prochainCours: null });
      }

      const s = seances[0];
      return res.json({
        prochainCours: {
          titre: s.titre,
          salle: s.salle,
          heureDebut: s.heureDebut,
          heureFin: s.heureFin,
          coursLibelle: (s as any).cours?.libelle || '',
          enseignantNom: (s as any).enseignant?.utilisateur?.prenoms + ' ' + (s as any).enseignant?.utilisateur?.nom || ''
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

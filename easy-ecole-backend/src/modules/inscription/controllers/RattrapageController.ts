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
import { Bordereau } from "../models/Bordereau";
import { ParametreFrais } from "../../comptabilite/models/ParametreFrais";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";

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
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
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
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
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
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
        ]
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
          { association: Bulletin.associations.cursusApprenant },
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
                { association: RattrapageInscription.associations.coursParticipant },
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

        if (rattrapage.source === 'demande_etudiant' && rattrapage.statutPaiement === 'impaye' && item.noteRattrapage != null) {
          return res.status(400).json({ success: false, message: "Paiement requis avant validation du rattrapage" });
        }

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

  static async creerDemandeEtudiant(req: Request, res: Response): Promise<Response | null> {
    if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" });
    }
    try {
      const { coursId, sessionExamenId, coursParticipantId, motifEtudiant, creneauSouhaite } = req.body;
      const utilisateurId = (req as any).utilisateurId;

      if (!coursId) {
        return res.status(400).json({ success: false, message: "coursId requis" });
      }

      let participant = await CoursParticipant.findOne({
        where: { coursId, utilisateurId }
      });

      if (!participant && coursParticipantId) {
        participant = await CoursParticipant.findByPk(coursParticipantId);
      }

      if (!participant) {
        return res.status(400).json({ success: false, message: "L'étudiant n'est pas inscrit à ce cours" });
      }

      const param = await ParametreFrais.findOne({ where: { cle: 'frais_rattrapage' } });
      const montant = param ? param.valeur : 5000;

      const rattrapage = await RattrapageInscription.create({
        coursParticipantId: participant.id,
        coursId,
        sessionExamenId: sessionExamenId || null,
        source: 'demande_etudiant',
        statut: 'inscrit',
        montant,
        statutPaiement: 'impaye',
        demandePar: utilisateurId,
        motifEtudiant: motifEtudiant || null,
        creneauSouhaite: creneauSouhaite || null,
      });

      const full = await RattrapageInscription.findByPk(rattrapage.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
        ]
      });
      return res.status(201).send(full);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getMesDemandes(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" });
    }
    try {
      const data = await RattrapageInscription.findAll({
        where: {
          demandePar: (req as any).utilisateurId,
          source: 'demande_etudiant'
        },
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur }
        ]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getDemandes(req: Request, res: Response): Promise<Response> {
    const role = (req as any).utilisateurRole;
    if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.CAISSIER_BANQUE) {
      return res.status(403).json({ success: false, message: "Accès réservé à l'institution" });
    }
    try {
      const where: any = { source: 'demande_etudiant' };
      if (req.query.statut) where.statut = req.query.statut;
      if (req.query.coursId) where.coursId = req.query.coursId;

      const data = await RattrapageInscription.findAll({
        where,
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur }
        ]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async programmerDemande(req: Request, res: Response): Promise<Response | null> {
    const role = (req as any).utilisateurRole;
    if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Accès réservé à l'institution" });
    }
    try {
      const rattrapage = await RattrapageInscription.findByPk(req.params.id);
      if (!rattrapage) return res.status(404).json({ success: false, message: "Rattrapage non trouvé" });

      const { dateRattrapage, heureDebut, heureFin, salle, enseignantId } = req.body;

      if (enseignantId) {
        const enseignantUser = await Utilisateur.findByPk(enseignantId);
        if (!enseignantUser || enseignantUser.role != RolesUtilisateur.ENSEIGNANT) {
          return res.status(400).json({ success: false, message: "L'utilisateur sélectionné n'est pas un enseignant" });
        }
      }

      await rattrapage.update({
        dateRattrapage: dateRattrapage || null,
        heureDebut: heureDebut || null,
        heureFin: heureFin || null,
        salle: salle || null,
        enseignantId: enseignantId || null,
        statut: 'convoque'
      });

      const full = await RattrapageInscription.findByPk(rattrapage.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen }
        ]
      });
      return res.status(200).send(full);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getEnseignantsDisponibles(req: Request, res: Response): Promise<Response> {
    const role = (req as any).utilisateurRole;
    if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Accès réservé à l'institution" });
    }
    try {
      const enseignants = await Enseignant.findAll({
        include: [{ association: Enseignant.associations.utilisateur }]
      });
      return res.status(200).send(enseignants);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async creerBordereauDemande(req: Request, res: Response): Promise<Response | null> {
    const role = (req as any).utilisateurRole;
    const utilisateurId = (req as any).utilisateurId;

    try {
      const rattrapage = await RattrapageInscription.findByPk(req.params.id);
      if (!rattrapage) return res.status(404).json({ success: false, message: "Rattrapage non trouvé" });

      const isOwner = role == RolesUtilisateur.APPRENANT && rattrapage.demandePar == utilisateurId;
      if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
        return res.status(403).json({ success: false });
      }

      if (!rattrapage.montant || rattrapage.montant <= 0) {
        return res.status(400).json({ success: false, message: "Le montant du rattrapage est invalide" });
      }

      if (rattrapage.statutPaiement === 'paye') {
        return res.status(400).json({ success: false, message: "Rattrapage déjà payé" });
      }

      const existingBordereau = await Bordereau.findOne({
        where: { referenceBancaire: `rattrapage-${rattrapage.id}` }
      });

      if (existingBordereau) {
        return res.status(200).send(existingBordereau);
      }

      const bordereau = new Bordereau();
      bordereau.type = 'scolarite';
      bordereau.utilisateurId = rattrapage.demandePar!;
      bordereau.fichier = `rattrapage-${rattrapage.id}.pdf`;
      bordereau.montant = Number(rattrapage.montant);
      bordereau.referenceBancaire = `rattrapage-${rattrapage.id}`;
      bordereau.statut = 'en_attente';
      bordereau.dateSoumission = new Date();
      await bordereau.save();

      return res.status(201).send(bordereau);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async confirmerPaiementDemande(req: Request, res: Response): Promise<Response | null> {
    const role = (req as any).utilisateurRole;
    if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.CAISSIER_BANQUE) {
      return res.status(403).json({ success: false, message: "Accès réservé à l'institution" });
    }
    try {
      const rattrapage = await RattrapageInscription.findByPk(req.params.id);
      if (!rattrapage) return res.status(404).json({ success: false, message: "Rattrapage non trouvé" });

      if (rattrapage.statutPaiement === 'paye') {
        return res.status(400).json({ success: false, message: "Rattrapage déjà payé" });
      }

      let paiementId: number | null = null;
      if (req.body.paiementId) {
        const parsed = Number(req.body.paiementId);
        if (Number.isFinite(parsed) && parsed > 0) {
          paiementId = parsed;
        }
      }

      if (paiementId == null) {
        const bordereau = await Bordereau.findOne({
          where: { referenceBancaire: `rattrapage-${rattrapage.id}` }
        });
        paiementId = bordereau ? bordereau.id : null;
      }

      await RattrapageInscription.update(
        { statutPaiement: 'paye', paiementId },
        { where: { id: rattrapage.id } }
      );

      const updated = await RattrapageInscription.findByPk(rattrapage.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur },
          { association: RattrapageInscription.associations.bordereau }
        ]
      });
      return res.status(200).send(updated);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async confirmerPaiementAutoDemande(req: Request, res: Response): Promise<Response | null> {
    const role = (req as any).utilisateurRole;
    const utilisateurId = (req as any).utilisateurId;

    try {
      const rattrapage = await RattrapageInscription.findByPk(req.params.id);
      if (!rattrapage) return res.status(404).json({ success: false, message: "Rattrapage non trouvé" });

      const isOwner = role == RolesUtilisateur.APPRENANT && rattrapage.demandePar == utilisateurId;
      if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
        return res.status(403).json({ success: false });
      }

      if (!rattrapage.montant || rattrapage.montant <= 0) {
        return res.status(400).json({ success: false, message: "Aucun frais à payer pour ce rattrapage" });
      }

      if (rattrapage.statutPaiement === 'paye') {
        return res.status(400).json({ success: false, message: "Rattrapage déjà payé" });
      }

      let bordereau = await Bordereau.findOne({
        where: { referenceBancaire: `rattrapage-${rattrapage.id}` }
      });

      if (!bordereau) {
        const param = await ParametreFrais.findOne({ where: { cle: 'frais_rattrapage' } });
        const montant = param ? param.valeur : 5000;

        bordereau = new Bordereau();
        bordereau.type = 'scolarite';
        bordereau.utilisateurId = rattrapage.demandePar!;
        bordereau.fichier = `rattrapage-${rattrapage.id}.pdf`;
        bordereau.montant = Number(montant);
        bordereau.referenceBancaire = `rattrapage-${rattrapage.id}`;
        bordereau.statut = 'en_attente';
        bordereau.dateSoumission = new Date();
        await bordereau.save();
      }

      bordereau.statut = 'valide';
      bordereau.dateValidation = new Date();
      bordereau.valideParId = utilisateurId;
      await bordereau.save();

      try {
        const compteProduitParam = await ParametreFrais.findOne({ where: { cle: 'compte_produit_rattrapage' } });
        const compteCreditNumero = compteProduitParam ? String(compteProduitParam.valeur) : '704';

        await creerEcritureComptable({
          req,
          journalCode: 'VEN',
          compteDebitNumero: '512',
          compteCreditNumero: compteCreditNumero,
          montant: bordereau.montant,
          libelle: `Paiement en ligne rattrapage #${rattrapage.id}`,
          reference: bordereau.referenceBancaire ?? `rattrapage-${bordereau.id}`,
          moduleSource: 'evaluations',
          referenceModuleId: String(rattrapage.id)
        });
      } catch (comptaError) {
        console.error("Erreur écriture comptable (non bloquante):", comptaError);
      }

      await RattrapageInscription.update(
        { statutPaiement: 'paye', paiementId: bordereau.id },
        { where: { id: rattrapage.id } }
      );

      const updated = await RattrapageInscription.findByPk(rattrapage.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur },
          { association: RattrapageInscription.associations.bordereau }
        ]
      });
      return res.status(200).send(updated);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

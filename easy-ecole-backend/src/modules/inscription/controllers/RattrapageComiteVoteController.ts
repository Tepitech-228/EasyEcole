import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { RattrapageInscription } from "../models/RattrapageInscription";
import { RattrapageComiteVote } from "../models/RattrapageComiteVote";
import { Utilisateur } from "../../auth/models/Utilisateur";

const STATUT_EN_ATTENTE = 'en_attente'

export default class RattrapageComiteVoteController {

  static async listerDemandes(req: Request, res: Response): Promise<Response> {
    try {
      const role = (req as any).utilisateurRole
      if (role !== RolesUtilisateur.COMITE_ORIENTATION && role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
        return res.status(403).json({ success: false, message: "Accès réservé au comité" })
      }

      const demandes = await RattrapageInscription.findAll({
        where: { statutDemande: STATUT_EN_ATTENTE },
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur },
        ],
        order: [['createdAt', 'DESC']],
      })

      const totalMembres = await Utilisateur.count({
        where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: { [Op.eq]: null } },
      })

      const data = demandes.map(async (demande) => {
        const votes = await RattrapageComiteVote.findAll({
          where: { rattrapageInscriptionId: demande.id },
        })
        const votesPlain = votes.map(v => v.get({ plain: true }))
        const valides = votes.filter((v: any) => v.decision === 'valide').length
        const aRejete = votes.some((v: any) => v.decision === 'rejete')
        const restants = totalMembres - votes.length
        const currentUserId = req.utilisateurId as number
        const aVote = votes.some((v: any) => v.membreId === currentUserId)
        const estUnanime = votes.length > 0 && !aRejete && valides === totalMembres
        const estRejete = aRejete

        return {
          ...demande.get({ plain: true }),
          quorum: {
            totalMembres,
            votesCount: votes.length,
            valides,
            restants,
            aVote,
            estUnanime,
            estRejete,
          },
          votes: votesPlain,
        }
      })

      const resolvedData = await Promise.all(data)
      return res.status(200).json({ success: true, data: resolvedData })
    } catch (error) {
      console.error('[ComiteRattrapage] listerDemandes:', error)
      return res.status(500).json({ success: false, message: 'Erreur interne' })
    }
  }

  static async detailDemande(req: Request, res: Response): Promise<Response> {
    try {
      const role = (req as any).utilisateurRole
      if (role !== RolesUtilisateur.COMITE_ORIENTATION && role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
        return res.status(403).json({ success: false, message: "Accès réservé au comité" })
      }

      const demande = await RattrapageInscription.findByPk(req.params.id, {
        include: [
          { association: RattrapageInscription.associations.coursParticipant },
          { association: RattrapageInscription.associations.cours },
          { association: RattrapageInscription.associations.sessionExamen },
          { association: RattrapageInscription.associations.demandeur },
        ],
      })
      if (!demande) {
        return res.status(404).json({ success: false, message: "Demande de rattrapage introuvable" })
      }

      const totalMembres = await Utilisateur.count({
        where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: { [Op.eq]: null } },
      })

      const votes = await RattrapageComiteVote.findAll({
        where: { rattrapageInscriptionId: demande.id },
      })
      const votesPlain = votes.map(v => v.get({ plain: true }))
      const valides = votes.filter((v: any) => v.decision === 'valide').length
      const aRejete = votes.some((v: any) => v.decision === 'rejete')
      const restants = totalMembres - votes.length
      const currentUserId = req.utilisateurId as number
      const aVote = votes.some((v: any) => v.membreId === currentUserId)
      const estUnanime = votes.length > 0 && !aRejete && valides === totalMembres
      const estRejete = aRejete

      const membres = await Utilisateur.findAll({
        where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: { [Op.eq]: null } },
        attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email'],
      })
      const membresPlain = membres.map(m => {
        const vote = votes.find((v: any) => v.membreId === m.id)
        return { ...m.get({ plain: true }), vote: vote ? vote.get({ plain: true }) : null }
      })

      return res.status(200).json({
        success: true,
        data: {
          ...demande.get({ plain: true }),
          quorum: { totalMembres, votesCount: votes.length, valides, restants, aVote, estUnanime, estRejete },
          votes: votesPlain,
          membres: membresPlain,
        },
      })
    } catch (error) {
      console.error('[ComiteRattrapage] detailDemande:', error)
      return res.status(500).json({ success: false, message: 'Erreur interne' })
    }
  }

  static async decider(req: Request, res: Response): Promise<Response | null> {
    const role = (req as any).utilisateurRole
    if (role !== RolesUtilisateur.COMITE_ORIENTATION && role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
      return res.status(403).json({ success: false, message: "Accès réservé au comité" })
    }

    const decision = req.body.decision
    if (!['valide', 'correction_demandee', 'rejete'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Décision invalide" })
    }

    const motif = typeof req.body.motif === 'string' ? req.body.motif.trim() : ''
    if (decision !== 'valide' && !motif) {
      return res.status(400).json({ success: false, message: "Motif requis pour une correction ou un rejet" })
    }

    const currentUserId = req.utilisateurId as number

    const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
    try {
      const demande = await RattrapageInscription.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!demande) {
        await transaction.rollback()
        return res.status(404).json({ success: false, message: "Demande de rattrapage introuvable" })
      }

      if (demande.statutDemande !== STATUT_EN_ATTENTE) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: "Cette demande n'est plus en attente de validation du comité" })
      }

      const totalMembres = await Utilisateur.count({
        where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: { [Op.eq]: null } },
        transaction,
      })
      if (totalMembres === 0) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: "Aucun membre du comité configuré" })
      }

      const voteExistant = await RattrapageComiteVote.findOne({
        where: { rattrapageInscriptionId: demande.id, membreId: currentUserId },
        transaction,
      })
      if (voteExistant) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: "Vous avez déjà voté sur cette demande" })
      }

      await RattrapageComiteVote.create({
        rattrapageInscriptionId: demande.id,
        membreId: currentUserId,
        decision,
        motif: decision === 'valide' ? null : motif,
      }, { transaction })

if (decision === 'rejete') {
         demande.statutDemande = 'rejete'
         demande.motifRejet = motif
         demande.dateValidationComite = new Date()
         await demande.save({ transaction })
         await transaction.commit()

         if (demande.demandePar !== null) {
           this.envoyerEmailRejet(demande.demandePar, motif)
         }

         return res.status(200).json({
           success: true,
           data: {
             demandeId: demande.id,
             decision,
             statutDemande: demande.statutDemande,
             quorum: { totalMembres, votesCount: 1, valides: 0, restants: totalMembres - 1, aVote: true, estUnanime: false, estRejete: true },
           },
         })
       }

if (decision === 'correction_demandee') {
          demande.statutDemande = 'correction_demandee'
          demande.motifRejet = motif
          demande.dateValidationComite = new Date()
          await demande.save({ transaction })
          await transaction.commit()

          if (demande.demandePar !== null) {
            this.envoyerEmailCorrection(demande.demandePar, motif)
          }

          return res.status(200).json({
            success: true,
            data: {
              demandeId: demande.id,
              decision,
              statutDemande: demande.statutDemande,
              quorum: { totalMembres, votesCount: 1, valides: 0, restants: totalMembres - 1, aVote: true, estUnanime: false, estRejete: false },
            },
          })
        }

      const votesValides = await RattrapageComiteVote.count({
        where: { rattrapageInscriptionId: demande.id, decision: 'valide' },
        transaction,
      })

      if (votesValides === totalMembres) {
        demande.statutDemande = 'valide'
        demande.motifRejet = null
        demande.dateValidationComite = new Date()
        await demande.save({ transaction })
        await transaction.commit()

        if (demande.demandePar !== null) {
          this.envoyerEmailValidation(demande.demandePar)
        }

        return res.status(200).json({
          success: true,
          data: {
            demandeId: demande.id,
            decision,
            statutDemande: demande.statutDemande,
            quorum: { totalMembres, votesCount: votesValides, valides: votesValides, restants: 0, aVote: true, estUnanime: true, estRejete: false },
          },
        })
      } else {
        await transaction.commit()

        return res.status(200).json({
          success: true,
          data: {
            demandeId: demande.id,
            decision,
            statutDemande: demande.statutDemande,
            quorum: { totalMembres, votesCount: votesValides + 1, valides: votesValides + 1, restants: totalMembres - votesValides - 1, aVote: true, estUnanime: false, estRejete: false },
          },
        })
      }
    } catch (error: any) {
      await transaction.rollback().catch(rbErr => console.error('[COMITE_RATTRAPAGE][decider] ROLLBACK:', rbErr))
      console.error('[ComiteRattrapage] decider:', error)
      return res.status(400).json({ success: false, message: error.message || 'Erreur interne' })
    }
  }

  static async listerVotes(req: Request, res: Response): Promise<Response> {
    try {
      const role = (req as any).utilisateurRole
      if (role !== RolesUtilisateur.COMITE_ORIENTATION && role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
        return res.status(403).json({ success: false, message: "Accès réservé au comité" })
      }

      const demande = await RattrapageInscription.findByPk(req.params.id)
      if (!demande) {
        return res.status(404).json({ success: false, message: "Demande de rattrapage introuvable" })
      }

      const votes = await RattrapageComiteVote.findAll({
        where: { rattrapageInscriptionId: req.params.id },
        include: [
          {
            association: RattrapageComiteVote.associations.membre,
            attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
      })

      return res.status(200).json({ success: true, data: votes })
    } catch (error) {
      console.error('[ComiteRattrapage] listerVotes:', error)
      return res.status(500).json({ success: false, message: 'Erreur interne' })
    }
  }

  private static async envoyerEmailValidation(utilisateurId: number) {
    try {
      const utilisateur = await Utilisateur.findByPk(utilisateurId)
      if (utilisateur?.email) {
        const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
EmailSender.getInstance().sendMail({
          to: utilisateur.email,
          subject: `Easy Ecole: Demande de rattrapage validée`,
          html: `<p>Bonjour <b>${nomComplet},</b></p>
            <p>Votre demande de rattrapage a été <b>validée</b> par le comité.</p>
            <p>Vous pouvez maintenant procéder au paiement des frais de rattrapage.</p>
            <p>Cordialement,<br>Easy Ecole</p>`
        })
      }
    } catch (emailError) {
      console.error("Erreur envoi email validation rattrapage:", emailError)
    }
  }

  private static async envoyerEmailRejet(utilisateurId: number, motif: string) {
    try {
      const utilisateur = await Utilisateur.findByPk(utilisateurId)
      if (utilisateur?.email) {
        const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
 EmailSender.getInstance().sendMail({
          to: utilisateur.email,
          subject: `Easy Ecole: Décision du comité concernant votre demande de rattrapage`,
          html: `<p>Bonjour <b>${nomComplet},</b></p>
            <p>Après examen de votre demande de rattrapage, le comité a rendu une décision de <strong>rejet</strong>.</p>
            <p><strong>Motif :</strong> ${motif}</p>
            <p>Cordialement,<br>Service des inscriptions — Easy Ecole</p>`
        })
      }
    } catch (emailError) {
      console.error("Erreur envoi email rejet rattrapage:", emailError)
    }
  }

  private static async envoyerEmailCorrection(utilisateurId: number, motif: string) {
    try {
      const utilisateur = await Utilisateur.findByPk(utilisateurId)
      if (utilisateur?.email) {
        const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
        EmailSender.getInstance().sendMail({
          to: utilisateur.email,
          subject: `Easy Ecole: Correction requise sur votre demande de rattrapage`,
          html: `<p>Bonjour <b>${nomComplet},</b></p>
            <p>Le comité d'inscription demande des <strong>corrections</strong> sur votre demande de rattrapage.</p>
            <p><strong>Motif :</strong> ${motif}</p>
            <p>Merci de vous rapprocher du service des inscriptions pour régulariser votre situation.</p>
            <p>Cordialement,<br>Service des inscriptions — Easy Ecole</p>`
        })
      }
    } catch (emailError) {
      console.error("Erreur envoi email correction rattrapage:", emailError)
    }
  }
}

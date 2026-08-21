import express from "express"
import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { AuthEsacompta } from "../../../core/middlewares/AuthEsacompta";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { ImputationService, ResultatImputation } from "../services/ImputationService";
import { GenererNotificationImputation } from "../services/NotificationImputationService";
import { BordereauDossierService } from "../services/BordereauDossierService";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

/**
 * Router dédié aux opérations financières ESA-COMPTA.
 * Monté sous /inscription/finance dans InscriptionRoutes.ts.
 */
const router = express.Router();

/**
 * @openapi
 * /inscription/finance/bordereaux-a-traiter:
 *   get:
 *     tags: [Finance]
 *     summary: Liste des bordereaux validés par le cabinet, en attente de saisie comptable
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des bordereaux
 */
router.get('/bordereaux-a-traiter', [AuthEsacompta, CheckPermission('action.finance.bordereau.voir')], async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    let options: FindOptions<InferAttributes<Bordereau>> = {
      include: [
        { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
        Bordereau.associations.utilisateur,
        Bordereau.associations.validePar,
        Bordereau.associations.typeOperation
      ],
      order: [['dateValidation', 'ASC']]
    }

    const statutsRecherches = ['valide', 'en_saisie_comptable']
    options.where = { statut: statutsRecherches as any }

    if (req.query.anneeAcademiqueId || req.query.niveauEtudeId || req.query.parcoursId) {
      const demandeWhere: any = { include: [] as any[] }
      const sessionWhere: any = {}

      if (req.query.anneeAcademiqueId) sessionWhere.anneeAcademiqueId = req.query.anneeAcademiqueId
      if (req.query.niveauEtudeId) sessionWhere.niveauEtudeId = req.query.niveauEtudeId

      if (Object.keys(sessionWhere).length > 0) {
        demandeWhere.include.push({
          association: (await import('../models/DemandeInscription')).DemandeInscription.associations.session,
          where: sessionWhere
        })
      }

      if (req.query.parcoursId) {
        demandeWhere.include.push({
          association: (await import('../models/DemandeInscription')).DemandeInscription.associations.parcoursChoisis,
          where: { choixFinal: true, parcoursId: req.query.parcoursId }
        })
      }

      const matchingDemandes = await (await import('../models/DemandeInscription')).DemandeInscription.findAll(demandeWhere)
      const utilisateurIds = [...new Set(matchingDemandes.map(d => d.utilisateurId))]

      if (utilisateurIds.length === 0) {
        return res.status(200).json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }

      options.where = { ...options.where, utilisateurId: utilisateurIds as any }
    }

    if (req.query.typeOperationId) {
      options.where = { ...options.where, typeOperationId: req.query.typeOperationId as string }
    }

    const { rows, count: total } = await Bordereau.findAndCountAll({ ...options, limit, offset });

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur', error);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
})

/**
 * @openapi
 * /inscription/finance/bordereaux/{id}/imputation-preview:
 *   post:
 *     tags: [Finance]
 *     summary: Calcule l'aperçu de l'imputation sans écrire en base
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Aperçu de l'imputation
 */
router.post('/bordereaux/:id/imputation-preview', [AuthEsacompta, CheckPermission('action.finance.bordereau.imputer')], async (req: Request, res: Response) => {
  try {
    const bordereau = await Bordereau.findByPk(req.params.id, {
      include: [
        { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
        Bordereau.associations.utilisateur
      ]
    })

    if (!bordereau) {
      return res.status(404).json({ success: false, message: "Bordereau non trouvé" })
    }

    const montant = Number(req.body.montantPaiement || bordereau.montant || 0)
    if (!Number.isFinite(montant) || montant <= 0) {
      return res.status(400).json({ success: false, message: "Montant de paiement invalide" })
    }

    const resultat = await ImputationService.simulerPourUtilisateur(
      bordereau.utilisateurId,
      montant
    )

    return res.status(200).json({ success: true, preview: resultat })
  } catch (error: any) {
    console.error('Erreur preview imputation:', error)
    return res.status(500).json({ success: false, message: error.message || 'Erreur interne' })
  }
})

/**
 * @openapi
 * /inscription/finance/bordereaux/{id}/saisir:
 *   put:
 *     tags: [Finance]
 *     summary: Saisie comptable du bordereau + imputation automatique + notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montantPaiement
 *             properties:
 *               montantPaiement:
 *                 type: number
 *               referenceBancaire:
 *                 type: string
 *               typeOperationId:
 *                 type: integer
 *               datePaiement:
 *                 type: string
 *                 format: date
 *               commentaire:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bordereau traité avec imputation
 */
router.put('/bordereaux/:id/saisir', [AuthEsacompta, CheckPermission('action.finance.bordereau.saisir')], async (req: Request, res: Response) => {
  const transaction = await DatabaseConnection.getInstance().sequelize.transaction()

  try {
    let bordereau = await Bordereau.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: [
        { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
        Bordereau.associations.utilisateur,
        Bordereau.associations.typeOperation
      ]
    })

    if (!bordereau) {
      await transaction.rollback()
      return res.status(404).json({ success: false, message: "Bordereau non trouvé" })
    }

    if (bordereau.statut === 'traite') {
      await transaction.rollback()
      return res.status(400).json({ success: false, message: "Bordereau déjà traité" })
    }

    const montantPaiement = Number(req.body.montantPaiement)
    if (!Number.isFinite(montantPaiement) || montantPaiement <= 0) {
      await transaction.rollback()
      return res.status(400).json({ success: false, message: "Montant de paiement invalide" })
    }

    // Mise à jour des informations financières
    bordereau.montant = montantPaiement
    bordereau.referenceBancaire = req.body.referenceBancaire ?? bordereau.referenceBancaire
    bordereau.typeOperationId = req.body.typeOperationId ?? bordereau.typeOperationId
    bordereau.datePaiement = req.body.datePaiement ? new Date(req.body.datePaiement) : bordereau.datePaiement
    bordereau.commentaire = req.body.commentaire ?? bordereau.commentaire
    bordereau.statut = 'traite'
    bordereau.dateValidation = bordereau.dateValidation || new Date()
    bordereau.valideParId = bordereau.valideParId || (req as any).utilisateurId

    await bordereau.save({ transaction })

    // Imputation FIFO
    const resultatImputation = await ImputationService.imputerPourUtilisateur(
      bordereau.id,
      bordereau.utilisateurId,
      montantPaiement,
      transaction
    )

    const typeOperation = bordereau.typeOperation
    const bordereauType = bordereau.type || typeOperation?.code?.toLowerCase() || 'scolarite'

    // Création du dossier étudiant pour inscription (flux ESA-Compta)
    if (bordereauType === 'inscription') {
      try {
        await BordereauDossierService.creerDossierEtudiantDepuisBordereau(bordereau, req, transaction)
      } catch (dossierError: any) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: dossierError.message || 'Erreur lors de la création du dossier étudiant' })
      }
    }

    if ((bordereauType === 'scolarite' || bordereauType === 'inscription') && bordereau.echeanceId) {
      const echeance = await Echeance.findByPk(bordereau.echeanceId, { transaction })
      if (echeance && echeance.statut !== 'paye') {
        echeance.statut = 'paye'
        echeance.datePaiement = bordereau.datePaiement || new Date()
        await echeance.save({ transaction })
      }
    }

    await transaction.commit()

    // Notification étudiant (hors transaction)
    try {
      if (bordereau.utilisateur?.email) {
        await GenererNotificationImputation.envoyer(
          bordereau.utilisateur,
          bordereau,
          resultatImputation
        )
      }
    } catch (notifError) {
      console.error("Erreur notification étudiant (non bloquante):", notifError)
    }

    return res.status(200).json({
      success: true,
      data: bordereau,
      lettrage: resultatImputation
    })
  } catch (error: any) {
    await transaction.rollback()
    console.error('[saisirBordereau]', error)
    return res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur' })
  }
})

export default router

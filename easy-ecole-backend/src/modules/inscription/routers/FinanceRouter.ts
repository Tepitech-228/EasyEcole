import express from "express"
import { Request, Response } from "express";
import path from "path";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { AuthEsacompta } from "../../../core/middlewares/AuthEsacompta";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { ImputationService, ResultatImputation } from "../services/ImputationService";
import { GenererNotificationImputation } from "../services/NotificationImputationService";
import { EtatPreInscription, PreInscription } from "../models/PreInscription";
import { Session } from "../models/Session";
import { BordereauDossierService } from "../services/BordereauDossierService";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { DocGenGeneratorService } from "../../docgen/services/DocGenGeneratorService";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";

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
 *               numeroBordereau:
 *                 type: string
 *               moyenPaiement:
 *                 type: string
 *                 enum: [virement, especes, mobile_money, cheque]
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

    // ── Règle du PREMIER bordereau de l'étudiant ──
    // Aucun dossier étudiant existant → ce bordereau est automatiquement rattaché
    // aux frais d'inscription : création complète du dossier (matricule, cursus,
    // cours, échéanciers), puis imputation FIFO qui solde d'abord les frais
    // d'inscription, le reste constituant le premier versement de scolarité.
    const { DossierEtudiant } = require('../models/DossierEtudiant')
    const dossierExistant = await DossierEtudiant.findOne({
      where: { utilisateurId: bordereau.utilisateurId },
      transaction,
    })
    const estPremierBordereau = !dossierExistant

    let typeOperationIdEffectif = req.body.typeOperationId ?? bordereau.typeOperationId
    let typeEffectif = bordereau.type
    if (estPremierBordereau) {
      typeEffectif = 'inscription'
      if (!typeOperationIdEffectif) {
        const typeInscription = await TypeOperationBordereau.findOne({ where: { code: 'INSCRIPTION' }, transaction })
        if (typeInscription) typeOperationIdEffectif = typeInscription.id
      }
    }

    // NOUVEAU : contrôle « premier bordereau ≥ frais d'inscription »
    // Un premier bordereau dont le montant est inférieur aux frais d'inscription
    // de la session est rejeté purement et simplement à la saisie ESA.
    if (estPremierBordereau) {
      const demande = await DemandeInscription.findOne({
        where: { utilisateurId: bordereau.utilisateurId },
        include: [{ association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] }],
        transaction,
      })
      const fraisInscriptionSession = (demande?.session?.fraisInscription || [])
        .reduce((sum, f) => sum + (f.montant || 0), 0)
      if (montantPaiement < fraisInscriptionSession) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: `Montant constaté (${montantPaiement}) inférieur aux frais d'inscription de la session (${fraisInscriptionSession}). Le bordereau doit au minimum couvrir les frais d'inscription.` })
      }
    }

    // Sécurité : pré-inscription posée/validée AVANT toute création de socle
    // financier — BordereauDossierService exige une pré-inscription VALIDE au
    // moment de créer le dossier étudiant (idempotent).
    const demandePipeline = await DemandeInscription.findOne({
      where: { utilisateurId: bordereau.utilisateurId },
      order: [['createdAt', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    if (demandePipeline && estPremierBordereau) {
      const preInscriptionExistante = await PreInscription.findOne({
        where: { demandeInscriptionId: demandePipeline.id },
        transaction,
      })
      if (!preInscriptionExistante) {
        await PreInscription.create({
          demandeInscriptionId: demandePipeline.id,
          statut: EtatPreInscription.VALIDE,
          commentaire: "Pré-inscription validée automatiquement lors de la saisie ESA du premier bordereau",
        }, { transaction })
      } else if (preInscriptionExistante.statut !== EtatPreInscription.VALIDE) {
        preInscriptionExistante.statut = EtatPreInscription.VALIDE
        await preInscriptionExistante.save({ transaction })
      }
    }

    // Mise à jour des informations financières
    bordereau.montant = montantPaiement
    bordereau.referenceBancaire = req.body.referenceBancaire ?? bordereau.referenceBancaire
    bordereau.numeroBordereau = req.body.numeroBordereau ?? bordereau.numeroBordereau
    bordereau.moyenPaiement = req.body.moyenPaiement ?? bordereau.moyenPaiement
    bordereau.typeOperationId = typeOperationIdEffectif
    bordereau.type = typeEffectif ?? null
    bordereau.datePaiement = req.body.datePaiement ? new Date(req.body.datePaiement) : bordereau.datePaiement
    bordereau.commentaire = req.body.commentaire ?? bordereau.commentaire
    bordereau.statut = 'traite'
    bordereau.dateValidation = bordereau.dateValidation || new Date()
    bordereau.valideParId = bordereau.valideParId || (req as any).utilisateurId

    await bordereau.save({ transaction })

    const typeOperation = bordereau.typeOperation
    const bordereauType = bordereau.type || typeOperation?.code?.toLowerCase() || 'scolarite'

    // Création du dossier étudiant AVANT l'imputation FIFO : pour un nouvel
    // étudiant, les échéances (inscription + scolarité) doivent exister au
    // moment de la cascade, sinon tout le montant partirait en portefeuille.
    if (bordereauType === 'inscription') {
      try {
        await BordereauDossierService.creerDossierEtudiantDepuisBordereau(
          bordereau,
          req,
          transaction,
          {
            ignorerVerifFrais: estPremierBordereau,
            // Règle métier : l'étudiant n'est "créé" (matricule définitif, cursus,
            // cours, carte) qu'après la validation FINALE du comité. À ce stade on
            // prépare uniquement le socle financier (dossier, échéanciers, snapshot).
            pedagogieDifferee: estPremierBordereau
          }
        )
      } catch (dossierError: any) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: dossierError.message || 'Erreur lors de la création du dossier étudiant' })
      }
    }

    // Imputation FIFO
    const resultatImputation = await ImputationService.imputerPourUtilisateur(
      bordereau.id,
      bordereau.utilisateurId,
      montantPaiement,
      transaction
    )

    if ((bordereauType === 'scolarite' || bordereauType === 'inscription') && bordereau.echeanceId) {
      const echeance = await Echeance.findByPk(bordereau.echeanceId, { transaction })
      if (echeance && echeance.statut !== 'paye') {
        echeance.statut = 'paye'
        echeance.datePaiement = bordereau.datePaiement || new Date()
        await echeance.save({ transaction })
      }
    }

    // Quitus de scolarité (PDF + GED + email étudiant), idempotent
    if (bordereauType === 'scolarite') {
      try {
        await BordereauDossierService.genererQuitusScolarite(bordereau, transaction)
      } catch (quitusError: any) {
        console.error("Erreur quitus scolarité (non bloquante):", quitusError)
      }
    }

    // ── Pipeline d'inscription (FLUX SÉQUENTIEL) ──
    // Le dossier reste BLOQUÉ ('authentifie') tant que la saisie ESA-COMPTA
    // n'est pas terminée : le comité ne voit pas le dossier (ComiteValidation
    // exige statutPipeline='transmis_comite'). C'est ICI, en FIN de saisie,
    // que la transmission au comité est déclenchée automatiquement.
    // (La pré-inscription est posée/validée PLUS HAUT, AVANT la création du
    // socle financier — voir bloc « Sécurité : pré-inscription ».)

    // FIN DE SAISIE ESA : si aucun bordereau non traité ne reste pour cet
    // étudiant (ni 'en_attente', ni 'valide' non encore saisi), le dossier est
    // transmis AUTOMATIQUEMENT au comité d'orientation.
    if (demandePipeline && (!demandePipeline.statutPipeline || ['soumis', 'authentifie'].includes(demandePipeline.statutPipeline))) {
      const restantsASaisir = await Bordereau.count({
        where: {
          utilisateurId: bordereau.utilisateurId,
          statut: { [Op.in]: ['en_attente', 'valide'] },
        },
        transaction,
      })
      if (restantsASaisir === 0) {
        demandePipeline.statutPipeline = 'transmis_comite'
        demandePipeline.soumissionComite = true
        await demandePipeline.save({ transaction })
      }
    }

    // Marquer la saisie ESA comme effectuée (AVANT le commit, dans la transaction)
    bordereau.statutPaiement = 'saisi'
    await bordereau.save({ transaction })

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

    // ── Email N°2 : transmission du dossier au comité de validation ──
    if (demandePipeline?.statutPipeline === 'transmis_comite') {
      try {
        const u: any = bordereau.utilisateur
        if (u?.email) {
          const nomComplet = `${u.prenoms || ''} ${u.nom || ''}`.trim() || 'étudiant(e)'
          await EmailSender.getInstance().sendPdf(
            u.email,
            nomComplet,
            "Votre dossier est transmis au comité de validation",
            `<p>Cher ${nomComplet},</p>
             <p>Les informations relatives à votre paiement ont été vérifiées et enregistrées par notre service comptable.</p>
             <p>Votre dossier est maintenant transmis au comité pour son examen final.</p>
             <p>Nous vous invitons à consulter régulièrement votre boîte mail afin de prendre connaissance de la décision du comité.</p>
             <p>Cordialement,<br>Service des inscriptions</p>`,
            '', ''
          )
        }
      } catch (emailTransError) {
        console.error("Erreur envoi email transmission comité (non bloquante):", emailTransError)
      }
    }

    // Reçu de scolarité docgen REC001 (non bloquant)
    if (bordereauType === 'scolarite') {
      try {
        const recu = await DocGenGeneratorService.generer(
          {
            typeCode: 'REC001',
            sourceType: 'bordereau',
            sourceId: bordereau.id,
            utilisateurId: (req as any).utilisateurId,
          },
          req
        );
        const etudiant = bordereau.utilisateur;
        if (etudiant?.email) {
          await EmailSender.getInstance().sendPdf(
            etudiant.email,
            `${etudiant.prenoms || ''} ${etudiant.nom || ''}`.trim() || 'étudiant(e)',
            `Easy Ecole: Reçu de scolarité ${recu.reference}`,
            `<p>Bonjour ${etudiant.prenoms || ''},</p><p>Veuillez trouver ci-joint votre <b>reçu de scolarité</b> (référence ${recu.reference}).</p><p>Cordialement,<br>Easy Ecole</p>`,
            recu.filePath,
            path.basename(recu.filePath)
          );
        }
      } catch (recuError) {
        console.error("Erreur génération du reçu de scolarité (non bloquante):", recuError)
      }
    }

    // Écriture comptable (non bloquant)
    try {
      const compteCreditNumero = bordereauType === 'scolarite' ? '701' : '702'
      await creerEcritureComptable({
        req,
        journalCode: 'VEN',
        compteDebitNumero: '512',
        compteCreditNumero,
        montant: bordereau.montant ?? 0,
        libelle: `Paiement bordereau #${bordereau.id} - ${bordereauType}`,
        reference: bordereau.referenceBancaire ?? `bordereau-${bordereau.id}`,
        moduleSource: 'inscription',
        referenceModuleId: String(bordereau.id)
      })
    } catch (comptaError) {
      console.error("Erreur écriture comptable (non bloquante):", comptaError)
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

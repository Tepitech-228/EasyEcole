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
import { PaiementInscription } from "../models/PaiementInscription";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
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
import { nanoid } from "nanoid";

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

    // Type simple demandé (optionnel) : l'aperçu restreint l'imputation aux
    // échéances de cette nature, comme le fera la saisie réelle.
    const typeRequested = String(req.body.type || '').toLowerCase()
    const imputationType: 'inscription' | 'scolarite' | undefined =
      typeRequested === 'inscription' || typeRequested === 'frais d\'inscription' ? 'inscription'
      : typeRequested === 'scolarite' || typeRequested === 'frais de scolarité' ? 'scolarite'
      : undefined

    const resultat = await ImputationService.simulerPourUtilisateur(
      bordereau.utilisateurId,
      montant,
      undefined,
      imputationType
    )

    return res.status(200).json({ success: true, preview: resultat })
  } catch (error: any) {
    console.error('Erreur preview imputation:', error)
    return res.status(500).json({ success: false, message: error.message || 'Erreur interne' })
  }
})

/**
 * POST /bordereaux/:id/composition-preview
 * Retourne la répartition automatique (inscription d'abord, reste scolarité)
 * + info bourse de l'étudiant si applicable.
 * Utile pour afficher un aperçu au comptable AVANT la saisie.
 */
router.post('/bordereaux/:id/composition-preview', [AuthEsacompta, CheckPermission('action.finance.bordereau.imputer')], async (req: Request, res: Response) => {
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

    // Frais inscription de la session
    const demande = await DemandeInscription.findOne({
      where: { utilisateurId: bordereau.utilisateurId },
      include: [{ association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] }],
    })
    const fraisInscriptionSession = (demande?.session?.fraisInscription || [])
      .reduce((sum: number, f: any) => sum + (f.montant || 0), 0)

    // Montant déjà payé en inscription
    const dossiers = await DossierEtudiant.findAll({ where: { utilisateurId: bordereau.utilisateurId } })
    let dejaPayeInscription = 0
    if (dossiers.length > 0) {
      const echeancesInscription = await Echeance.findAll({
        where: { dossierEtudiantId: dossiers.map(d => d.id), type: 'inscription' },
      })
      dejaPayeInscription = echeancesInscription.reduce((sum, e) => sum + (e.montantPaye || 0), 0)
    }

    const resteInscription = Math.max(0, fraisInscriptionSession - dejaPayeInscription)
    const montantInscription = Math.min(montant, resteInscription)
    const montantScolarite = Math.round((montant - montantInscription) * 100) / 100

    // Bourse de l'étudiant
    let bourse: any = null
    if (dossiers.length > 0) {
      try {
        const { BourseAttribution } = await import('../../bourse/models/BourseAttribution')
        const { BourseConfiguration } = await import('../../bourse/models/BourseConfiguration')
        const attribution = await BourseAttribution.findOne({
          where: { dossierEtudiantId: dossiers.map(d => d.id), statut: 'ACTIVE' },
          include: [{ model: BourseConfiguration, as: 'configuration' }],
        })
        if (attribution) {
          bourse = {
            type: attribution.type,
            taux: Number(attribution.taux),
            nom: (attribution as any).configuration?.nom || 'Bourse',
            reductionScolarite: Math.round(montantScolarite * Number(attribution.taux) / 100 * 100) / 100,
          }
        }
      } catch (e) {
        // Module bourse non disponible — pas bloquant
      }
    }

    // Montant scolarité après réduction bourse (pour info)
    let montantScolariteApresBourse = montantScolarite
    if (bourse && bourse.reductionScolarite > 0) {
      montantScolariteApresBourse = Math.max(0, Math.round((montantScolarite - bourse.reductionScolarite) * 100) / 100)
    }

    return res.status(200).json({
      success: true,
      composition: {
        inscription: Math.round(montantInscription * 100) / 100,
        scolarite: montantScolarite,
        scolariteApresBourse: montantScolariteApresBourse,
      },
      fraisInscriptionSession,
      dejaPayeInscription,
      resteInscription,
      bourse,
    })
  } catch (error: any) {
    console.error('Erreur composition-preview:', error)
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
  *               composition:
  *                 type: array
  *                 description: Répartition obligatoire pour un type d'opération MIXTE (somme = montantPaiement)
  *                 items:
  *                   type: object
  *                   properties:
  *                     type:
  *                       type: string
  *                       enum: [inscription, scolarite]
  *                     montant:
  *                       type: number
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
  const _rid = `[SAISIR#${req.params.id}]`

  try {
    console.log(_rid, 'Début saisie — body:', JSON.stringify({
      montantPaiement: req.body.montantPaiement,
      referenceBancaire: req.body.referenceBancaire,
      numeroBordereau: req.body.numeroBordereau,
      moyenPaiement: req.body.moyenPaiement,
      typeOperationId: req.body.typeOperationId,
      datePaiement: req.body.datePaiement,
      commentaire: req.body.commentaire,
    }))

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
      console.log(_rid, 'ERREUR 404: Bordereau non trouvé')
      return res.status(404).json({ success: false, message: "Bordereau non trouvé" })
    }

    console.log(_rid, 'Bordereau trouvé — statut:', bordereau.statut, 'type:', bordereau.type, 'utilisateurId:', bordereau.utilisateurId, 'typeOperationId:', bordereau.typeOperationId)

    if (bordereau.statut === 'traite') {
      await transaction.rollback()
      console.log(_rid, 'ERREUR 400: Bordereau déjà traité')
      return res.status(400).json({ success: false, message: "Bordereau déjà traité", details: { statut: bordereau.statut } })
    }

    const montantPaiement = Number(req.body.montantPaiement)
    if (!Number.isFinite(montantPaiement) || montantPaiement <= 0) {
      await transaction.rollback()
      console.log(_rid, 'ERREUR 400: Montant invalide — reçu:', req.body.montantPaiement, '→ Number:', montantPaiement)
      return res.status(400).json({ success: false, message: "Montant de paiement invalide", details: { recu: req.body.montantPaiement, parsed: montantPaiement } })
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

    let typeOperationIdEffectif: number | null = req.body.typeOperationId ? Number(req.body.typeOperationId) : (bordereau.typeOperationId ?? null)
    let typeEffectif: any = bordereau.type

    // Résolution du code d'opération choisi (bordereau.type peut encore être NULL
    // avant la première saisie : le choix réel est le typeOperationId du formulaire).
    let typeOperationCode: string | null = bordereau.typeOperation?.code?.toUpperCase() ?? null
    if (!typeOperationCode && typeOperationIdEffectif) {
      const to = await TypeOperationBordereau.findByPk(typeOperationIdEffectif, { transaction })
      typeOperationCode = to?.code?.toUpperCase() ?? null
    }
    const estMixte = typeEffectif === 'mixte' || typeOperationCode === 'MIXTE'
    const estScolarite = typeEffectif === 'scolarite' || typeOperationCode === 'SCOLARITE'

    if (estPremierBordereau && !estMixte && !estScolarite) {
      typeEffectif = 'inscription'
      if (!typeOperationIdEffectif) {
        const typeInscription = await TypeOperationBordereau.findOne({ where: { code: 'INSCRIPTION' }, transaction })
        if (typeInscription) typeOperationIdEffectif = typeInscription.id
      }
    }
    if (estMixte) {
      typeEffectif = 'mixte'
      if (!typeOperationIdEffectif) {
        const typeMixte = await TypeOperationBordereau.findOne({ where: { code: 'MIXTE' }, transaction })
        if (typeMixte) typeOperationIdEffectif = typeMixte.id
      }
    }
    if (estScolarite) {
      typeEffectif = 'scolarite'
      if (!typeOperationIdEffectif) {
        const typeScolarite = await TypeOperationBordereau.findOne({ where: { code: 'SCOLARITE' }, transaction })
        if (typeScolarite) typeOperationIdEffectif = typeScolarite.id
      }
    }

    console.log(_rid, 'Contexte:', { estPremierBordereau, estMixte, typeEffectif, typeOperationIdEffectif, typeOperationCode })

    // ── Validation de la composition (type MIXTE) ──
    // Si le comptable fournit une composition explicite, on la valide.
    // Sinon, on calcule automatiquement : inscription d'abord (= frais inscription de
    // la session), puis scolarité pour le reste. Plus besoin de saisie manuelle.
    let composition: { type: 'inscription' | 'scolarite'; montant: number }[] | null = null
    if (estMixte) {
      const raw = req.body.composition

      if (Array.isArray(raw) && raw.length > 0) {
        // Composition explicite fournie par l'utilisateur → validation classique
        composition = []
        for (const c of raw) {
          const t = String(c?.type || '').toLowerCase()
          const m = Number(c?.montant)
          if (!['inscription', 'scolarite'].includes(t)) {
            await transaction.rollback()
            console.log(_rid, 'ERREUR 400: Type Mixte — nature inconnue:', t)
            return res.status(400).json({ success: false, message: `Type Mixte : nature « ${t} » inconnue (autorisées : inscription, scolarite).` })
          }
          if (!Number.isFinite(m) || m <= 0) {
            await transaction.rollback()
            console.log(_rid, 'ERREUR 400: Type Mixte — montant invalide pour', t, ':', m)
            return res.status(400).json({ success: false, message: "Type Mixte : chaque composante doit avoir un montant positif." })
          }
          composition.push({ type: t as 'inscription' | 'scolarite', montant: Math.round(m * 100) / 100 })
        }
        const sommeComposition = Math.round(composition.reduce((s, c) => s + c.montant, 0) * 100) / 100
        if (Math.abs(sommeComposition - montantPaiement) > 0.01) {
          await transaction.rollback()
          console.log(_rid, 'ERREUR 400: Type Mixte — somme composition', sommeComposition, '!== montant', montantPaiement)
          return res.status(400).json({ success: false, message: `Type Mixte : la somme de la répartition (${sommeComposition}) doit être égale au montant constaté (${montantPaiement}).` })
        }
      } else {
        // ── AUTO-COMPOSITION : inscription d'abord, puis scolarité ──
        // Récupérer les frais d'inscription de la session
        const demande = await DemandeInscription.findOne({
          where: { utilisateurId: bordereau.utilisateurId },
          include: [{ association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] }],
          transaction,
        })
        const fraisInscriptionSession = (demande?.session?.fraisInscription || [])
          .reduce((sum: number, f: any) => sum + (f.montant || 0), 0)

        // Calculer le montant déjà payé en inscription
        const dossiers = await DossierEtudiant.findAll({
          where: { utilisateurId: bordereau.utilisateurId },
          transaction,
        })
        let dejaPayeInscription = 0
        if (dossiers.length > 0) {
          const echeancesInscription = await Echeance.findAll({
            where: { dossierEtudiantId: dossiers.map((d: any) => d.id), type: 'inscription' },
            transaction,
          })
          dejaPayeInscription = echeancesInscription.reduce((sum: number, e: any) => sum + (e.montantPaye || 0), 0)
        }

        const resteInscription = Math.max(0, fraisInscriptionSession - dejaPayeInscription)
        const montantInscription = Math.min(montantPaiement, resteInscription)
        const montantScolarite = Math.round((montantPaiement - montantInscription) * 100) / 100

        composition = []
        if (montantInscription > 0) {
          composition.push({ type: 'inscription', montant: Math.round(montantInscription * 100) / 100 })
        }
        if (montantScolarite > 0) {
          composition.push({ type: 'scolarite', montant: montantScolarite })
        }
      }
    }

    // NOUVEAU : contrôle « premier bordereau ≥ frais d'inscription »
    // Un premier bordereau dont le montant est inférieur aux frais d'inscription
    // de la session est rejeté purement et simplement à la saisie ESA.
    // Pour un bordereau MIXTE auto-composé, la composition garantit déjà que
    // inscription = reste à payer. Ce garde-fou ne sert qu'en composition explicite.
    if (estPremierBordereau && composition && composition.length > 0) {
      const demandeGuard = await DemandeInscription.findOne({
        where: { utilisateurId: bordereau.utilisateurId },
        include: [{ association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] }],
        transaction,
      })
      const fraisInscriptionSessionGuard = (demandeGuard?.session?.fraisInscription || [])
        .reduce((sum, f) => sum + (f.montant || 0), 0)
      const montantPartInscription = estMixte
        ? composition.filter(c => c.type === 'inscription').reduce((s, c) => s + c.montant, 0)
        : montantPaiement
      if (montantPartInscription < fraisInscriptionSessionGuard) {
        await transaction.rollback()
        console.log(_rid, 'ERREUR 400: Part inscription', montantPartInscription, '< frais inscription session', fraisInscriptionSessionGuard)
        return res.status(400).json({ success: false, message: `La part inscription (${montantPartInscription}) est inférieure aux frais d'inscription de la session (${fraisInscriptionSessionGuard}). Le premier versement doit au minimum couvrir les frais d'inscription.` })
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
    // Sanitiser les chaînes vides → null (évite les erreurs ENUM et FK)
    const refBancaire = (req.body.referenceBancaire || '').trim() || null
    const numBordereau = (req.body.numeroBordereau || '').trim() || null
    const moyPaiement = (req.body.moyenPaiement || '').trim() || null
    const datePaiement = req.body.datePaiement ? new Date(req.body.datePaiement) : bordereau.datePaiement

    console.log(_rid, 'Sanitization:', { refBancaire, numBordereau, moyPaiement, datePaiement, typeOperationIdEffectif, typeEffectif })

    bordereau.montant = montantPaiement
    bordereau.referenceBancaire = refBancaire
    bordereau.numeroBordereau = numBordereau
    bordereau.moyenPaiement = moyPaiement as any
    bordereau.typeOperationId = typeOperationIdEffectif
    bordereau.type = typeEffectif ?? null
    bordereau.composition = estMixte && composition ? JSON.stringify(composition) : null
    bordereau.datePaiement = datePaiement
    bordereau.commentaire = (req.body.commentaire || '').trim() || null
    bordereau.statut = 'traite'
    bordereau.dateValidation = bordereau.dateValidation || new Date()
    bordereau.valideParId = bordereau.valideParId || (req as any).utilisateurId

    try {
      await bordereau.save({ transaction })
      console.log(_rid, 'Bordereau sauvegardé avec succès')
    } catch (saveError: any) {
      await transaction.rollback()
      console.log(_rid, 'ERREUR 500: Échec save bordereau:', saveError.message, saveError?.parent?.code)
      return res.status(500).json({ success: false, message: `Erreur de sauvegarde du bordereau: ${saveError.message}` })
    }

    const typeOperation = bordereau.typeOperation
    const bordereauType = bordereau.type || typeOperation?.code?.toLowerCase() || 'scolarite'

    // Création du dossier étudiant AVANT l'imputation FIFO : pour un nouvel
    // étudiant, les échéances (inscription + scolarité) doivent exister au
    // moment de la cascade, sinon tout le montant partirait en portefeuille.
    if (bordereauType === 'inscription' || (bordereauType === 'mixte' && estPremierBordereau)) {
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
        console.log(_rid, 'ERREUR 400: Dossier creation failed:', dossierError.message || dossierError)
        return res.status(400).json({ success: false, message: dossierError.message || 'Erreur lors de la création du dossier étudiant' })
      }
    }

    // Imputation : FIFO classique, ou par composition pour un bordereau MIXTE
    // (chaque nature déclarée est imputée sur ses propres échéances, plafonnée
    // à son montant — l'excédent éventuel part au portefeuille de crédit).
    // Pour un type SIMPLE, on restreint l'imputation à la nature choisie :
    //   - "inscription" → uniquement les échéances d'inscription (FIFO)
    //   - "scolarite"   → uniquement les échéances de scolarité (FIFO)
    // Une nature déjà soldée → le montant part au portefeuille, consommé ensuite
    // FIFO sur les autres natures (consommerPortefeuille ci-dessous).
    const imputationType: 'inscription' | 'scolarite' | undefined =
      bordereauType === 'inscription' ? 'inscription'
      : bordereauType === 'scolarite' ? 'scolarite'
      : undefined

    const resultatImputation = (bordereauType === 'mixte' && composition)
      ? await ImputationService.imputerPourUtilisateurParComposition(
          bordereau.id,
          bordereau.utilisateurId,
          composition!,
          transaction
        )
      : await ImputationService.imputerPourUtilisateur(
          bordereau.id,
          bordereau.utilisateurId,
          montantPaiement,
          transaction,
          imputationType
        )

    // Consommation automatique du crédit de portefeuille : le solde soldera
    // autant d'échéances entières que possible (FIFO), puis le reliquat paie
    // partiellement l'échéance suivante — le portefeuille repart à zéro.
    let consommationPortefeuille: { consomme: number; soldeRestant: number } | null = null
    try {
      consommationPortefeuille = await ImputationService.consommerPortefeuilleUtilisateur(
        bordereau.utilisateurId,
        transaction
      )
    } catch (consoError: any) {
      console.error("Consommation portefeuille (non bloquante):", consoError?.message || consoError)
    }

    // ── Création de l'écriture de paiement (TOUS les bordereaux) ──
    // Garantit la traçabilité : chaque bordereau traité génère un PaiementInscription,
    // même si le type est null ou si le dossier existe déjà.
    try {
      const paiementExistant = await PaiementInscription.findOne({
        where: { description: { [Op.like]: `%bordereau #${bordereau.id}%` } },
        transaction,
      })
      if (!paiementExistant) {
        const dossierEtudiant = await DossierEtudiant.findOne({
          where: { utilisateurId: bordereau.utilisateurId },
          transaction,
        })
        const matricule = dossierEtudiant?.matricule ?? `TEMP-${bordereau.utilisateurId}`
        const paiement = new PaiementInscription()
        paiement.numero = 'PAY-' + nanoid(10)
        paiement.datePaiement = bordereau.datePaiement || new Date()
        paiement.montant = montantPaiement
        paiement.utilisateurId = bordereau.utilisateurId
        paiement.matriculeInscription = matricule
        paiement.description = `Paiement par bordereau #${bordereau.id} (${bordereau.type || 'mixte'})`
        paiement.type = TypesPaiement.EN_LIGNE
        await paiement.save({ transaction })
        console.log(_rid, `Paiement #${paiement.id} créé pour bordereau #${bordereau.id}`)
      }
    } catch (paiementError: any) {
      console.error("Erreur création paiement (non bloquante):", paiementError?.message || paiementError)
    }

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

    // ── Alerte « double mixte » dans la même session académique ──
    // Un bordereau « mixte » répartit inscription + scolarité. Si un autre
    // bordereau mixte a déjà été TRAITÉ pour ce même étudiant dans la même
    // session, on remonte une alerte au comptable (non bloquante) pour signaler
    // un éventuel doublon. Un type simple (inscription/scolarité) ne déclenche
    // pas cette alerte : seule la saisie « mixte » est concernée.
    const avertissements: string[] = []
    if (estMixte) {
      try {
        const demandeMixte = await DemandeInscription.findOne({
          where: { utilisateurId: bordereau.utilisateurId },
          order: [['createdAt', 'DESC']],
          transaction,
        })
        if (demandeMixte?.sessionId) {
          const autresDemandes = await DemandeInscription.findAll({
            where: { sessionId: demandeMixte.sessionId },
            attributes: ['utilisateurId'],
            transaction,
          })
          const autresUtilisateurIds = [...new Set(autresDemandes.map(d => d.utilisateurId))]
          const mixteDejaTraités = await Bordereau.count({
            where: {
              utilisateurId: { [Op.in]: autresUtilisateurIds as number[] },
              type: 'mixte',
              statut: 'traite',
              id: { [Op.ne]: bordereau.id },
            },
            transaction,
          })
          if (mixteDejaTraités > 0) {
            avertissements.push('Un bordereau de type « mixte » a déjà été traité pour cet étudiant dans la même session académique. Vérifiez qu\'il ne s\'agit pas d\'un doublon avant de valider.')
          }
        }
      } catch (mixteError) {
        console.error('Détection double mixte (non bloquante):', mixteError)
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
      lettrage: resultatImputation,
      portefeuille: consommationPortefeuille,
      avertissements
    })
  } catch (error: any) {
    await transaction.rollback()
    console.error(_rid, 'ERREUR 500 FATALE:', error.message || error, error.stack?.split('\n').slice(0, 3).join(' | '))
    return res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur' })
  }
})

export default router

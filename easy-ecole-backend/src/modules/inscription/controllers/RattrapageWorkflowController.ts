import { Request, Response } from "express";
import { Op, fn, col } from "sequelize";
import fs from "fs";
import path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RattrapageSession } from "../models/RattrapageSession";
import { RattrapageSessionClasse } from "../models/RattrapageSessionClasse";
import { RattrapageDocumentRequis } from "../models/RattrapageDocumentRequis";
import { RattrapageDocumentDepose } from "../models/RattrapageDocumentDepose";
import { RattrapageInscription } from "../models/RattrapageInscription";
import { Bordereau } from "../models/Bordereau";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { ParametreFrais } from "../../comptabilite/models/ParametreFrais";

/**
 * Workflow officiel de rattrapage (sessions, demandes étudiantes, comité, paiement).
 *
 * Flux :
 *  1. ADMIN/INSTITUTION crée une session (libellé, période, classes concernées, pièces requises)
 *     puis l'ouvre (`statut: 'ouverte'`) et la clôture (`statut: 'cloturee'`) via PUT /sessions/:id.
 *  2. APPRENANT soumet une demande + téléverse les justificatifs requis.
 *  3. COMITÉ (comite_orientation / institution / admin) valide → débloque le paiement, ou rejette avec motif.
 *  4. APPRENANT dépose son bordereau de paiement (montant = paramètre global 'frais_rattrapage').
 *  5. CABINET_COMPTABLE/ADMIN confirme le paiement → inscription définitive aux épreuves.
 */
export default class RattrapageWorkflowController {

  /** Rôles autorisés à créer/paramétrer les sessions (étape 1). */
  private static readonly ROLE_ADMIN_SESSION = [RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION]

  /** Rôles autorisés à statuer (valider/rejeter) en tant que comité (étape 3). */
  private static readonly ROLE_COMITE = [
    RolesUtilisateur.COMITE_ORIENTATION,
    RolesUtilisateur.ADMIN,
    RolesUtilisateur.INSTITUTION,
  ]

  /** Rôles autorisés à confirmer le paiement (étape 5). */
  private static readonly ROLE_PAIEMENT = [RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN]

  /** Rôles autorisés à consulter toutes les demandes (vs. ses propres demandes pour l'apprenant). */
  private static readonly ROLE_VISION_TOTAL = [
    RolesUtilisateur.COMITE_ORIENTATION,
    RolesUtilisateur.ADMIN,
    RolesUtilisateur.INSTITUTION,
    RolesUtilisateur.CABINET_COMPTABLE,
  ]

  /** Valeurs acceptées pour RattrapageSession.statut. */
  private static readonly STATUTS_SESSION = ['preparation', 'ouverte', 'cloturee']

  /** Répertoire relatif (cwd) où les justificatifs de rattrapage sont stockés. */
  private static readonly CHEMIN_RATTRAPAGE = 'public/inscription/rattrapage'

  /** Includes standard d'une session de rattrapage (classes + documents requis). */
  private static includesSession(avecInscriptions = false) {
    const includes: any[] = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { association: RattrapageSession.associations.anneeAcademique },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { association: RattrapageSession.associations.classes, include: [{ association: RattrapageSessionClasse.associations.classe }], required: false },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { association: RattrapageSession.associations.documentsRequis, required: false },
    ]
    if (avecInscriptions) {
      includes.push({ association: RattrapageSession.associations.inscriptions, required: false })
    }
    return includes
  }

  /** Includes standard d'une demande de rattrapage (session, demandeur, pièces, bordereau). */
  private static includesDemande() {
    return [
      {
        association: RattrapageInscription.associations.rattrapageSession,
        include: [
          { association: RattrapageSession.associations.documentsRequis, required: false },
        ],
      },
      {
        association: RattrapageInscription.associations.demandeur,
        attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email', 'role'],
      },
      {
        association: RattrapageInscription.associations.documentsDeposes,
        include: [{ association: RattrapageDocumentDepose.associations.documentRequis }],
        required: false,
      },
      { association: RattrapageInscription.associations.bordereauDepose, required: false },
    ]
  }

  /** Nettoie un fichier déjà écrit par multer si l'enregistrement en base échoue. */
  private static nettoyerFichier(cheminAbsolu: string): void {
    try {
      if (cheminAbsolu && fs.existsSync(cheminAbsolu)) fs.unlinkSync(cheminAbsolu)
    } catch (_) { /* fichier déjà supprimé */ }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. SESSIONS DE RATTRAPAGE — ADMIN / INSTITUTION
  // ─────────────────────────────────────────────────────────────

  /** POST /rattrapage-workflow/sessions — crée une session + pivot classes + documents requis. */
  static async creerSession(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role || !RattrapageWorkflowController.ROLE_ADMIN_SESSION.includes(role)) {
      return res.status(403).json({ success: false, message: "Création de session réservée à l'administration" })
    }

    const body = req.body || {}
    const libelle = typeof body.libelle === 'string' ? body.libelle.trim() : ''
    if (!libelle) return res.status(400).json({ success: false, message: 'libelle est requis' })

    const anneeAcademiqueId = body.anneeAcademiqueId ? Number(body.anneeAcademiqueId) : null
    const classesId: number[] = Array.isArray(body.classesId)
      ? [...new Set<number>(body.classesId.map((c: any) => Number(c)).filter((n: number) => Number.isInteger(n) && n > 0))]
      : []
    const documentsRequis: any[] = Array.isArray(body.documentsRequis) ? body.documentsRequis : []

    const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
    try {
      if (anneeAcademiqueId) {
        const annee = await AnneeAcademique.findByPk(anneeAcademiqueId)
        if (!annee) {
          await transaction.rollback()
          return res.status(400).json({ success: false, message: 'Année académique introuvable' })
        }
      }

      const session = await RattrapageSession.create({
        libelle,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : null,
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        anneeAcademiqueId,
        statut: 'preparation',
        description: typeof body.description === 'string' ? body.description : null,
      }, { transaction })

      if (classesId.length > 0) {
        try {
          await RattrapageSessionClasse.bulkCreate(
            classesId.map(classeId => ({ rattrapageSessionId: session.id, classeId })),
            { transaction }
          )
        } catch (error: any) {
          // Contrainte unique composite (rattrapageSessionId, classeId) déjà couverte
          // par le dédoublonnage ci-dessus ; on garde une issue propre si elle survient
          // malgré tout (double requête concurrente par exemple).
          if (error?.name === 'SequelizeUniqueConstraintError') {
            await transaction.rollback()
            return res.status(400).json({ success: false, message: 'Une classe est déjà associée à cette session' })
          }
          throw error
        }
      }

      if (documentsRequis.length > 0) {
        await RattrapageDocumentRequis.bulkCreate(
          documentsRequis.map((doc: any, index: number) => ({
            rattrapageSessionId: session.id,
            libelle: String(doc?.libelle || `Pièce ${index + 1}`),
            obligatoire: doc?.obligatoire !== false,
            ordre: Number.isFinite(Number(doc?.ordre)) ? Number(doc.ordre) : index,
          })),
          { transaction }
        )
      }

      await transaction.commit()

      const full = await RattrapageSession.findByPk(session.id, {
        include: RattrapageWorkflowController.includesSession(),
      })
      return res.status(201).json({ success: true, data: full })
    } catch (error) {
      await transaction.rollback()
      console.error('[creerSession rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** PUT /rattrapage-workflow/sessions/:id — met à jour la session, remplace classes/docs si fournis. */
  static async modifierSession(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role || !RattrapageWorkflowController.ROLE_ADMIN_SESSION.includes(role)) {
      return res.status(403).json({ success: false, message: "Modification de session réservée à l'administration" })
    }

    const session = await RattrapageSession.findByPk(req.params.id)
    if (!session) return res.status(404).json({ success: false, message: 'Session de rattrapage introuvable' })

    const body = req.body || {}
    const classesId = Array.isArray(body.classesId)
      ? [...new Set<number>(body.classesId.map((c: any) => Number(c)).filter((n: number) => Number.isInteger(n) && n > 0))]
      : null
    const documentsRequis = Array.isArray(body.documentsRequis) ? body.documentsRequis : null

    const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
    try {
      const updateData: any = {}
      if (typeof body.libelle === 'string' && body.libelle.trim()) updateData.libelle = body.libelle.trim()
      if (body.dateDebut !== undefined) updateData.dateDebut = body.dateDebut ? new Date(body.dateDebut) : null
      if (body.dateFin !== undefined) updateData.dateFin = body.dateFin ? new Date(body.dateFin) : null
      if (body.description !== undefined) updateData.description = body.description ?? null
      if (body.anneeAcademiqueId !== undefined) {
        const anneeId = body.anneeAcademiqueId ? Number(body.anneeAcademiqueId) : null
        if (anneeId) {
          const annee = await AnneeAcademique.findByPk(anneeId)
          if (!annee) {
            await transaction.rollback()
            return res.status(400).json({ success: false, message: 'Année académique introuvable' })
          }
        }
        updateData.anneeAcademiqueId = anneeId
      }
      if (body.statut !== undefined) {
        if (!RattrapageWorkflowController.STATUTS_SESSION.includes(body.statut)) {
          await transaction.rollback()
          return res.status(400).json({ success: false, message: "Statut invalide (préparation, ouverte, cloturee)" })
        }
        updateData.statut = body.statut
      }

      if (Object.keys(updateData).length > 0) {
        await session.update(updateData, { transaction })
      }

      // Remplacement propre des classes concernées (suppression puis recréation).
      if (Array.isArray(classesId)) {
        await RattrapageSessionClasse.destroy({ where: { rattrapageSessionId: session.id }, transaction })
        if (classesId.length > 0) {
          await RattrapageSessionClasse.bulkCreate(
            classesId.map(classeId => ({ rattrapageSessionId: session.id, classeId })),
            { transaction }
          )
        }
      }

      // Remplacement propre des pièces justificatives requises (les documents déposés
      // associés sont supprimés en cascade via la FK onDelete CASCADE).
      if (documentsRequis !== null) {
        await RattrapageDocumentRequis.destroy({ where: { rattrapageSessionId: session.id }, transaction })
        if (documentsRequis.length > 0) {
          await RattrapageDocumentRequis.bulkCreate(
            documentsRequis.map((doc: any, index: number) => ({
              rattrapageSessionId: session.id,
              libelle: String(doc?.libelle || `Pièce ${index + 1}`),
              obligatoire: doc?.obligatoire !== false,
              ordre: Number.isFinite(Number(doc?.ordre)) ? Number(doc.ordre) : index,
            })),
            { transaction }
          )
        }
      }

      await transaction.commit()

      const full = await RattrapageSession.findByPk(session.id, {
        include: RattrapageWorkflowController.includesSession(),
      })
      return res.status(200).json({ success: true, data: full })
    } catch (error) {
      await transaction.rollback()
      console.error('[modifierSession rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** GET /rattrapage-workflow/sessions — liste les sessions (tous connectés) + nb de demandes. */
  static async listerSessions(req: Request, res: Response): Promise<Response> {
    try {
      const sessions = await RattrapageSession.findAll({
        include: RattrapageWorkflowController.includesSession(),
        order: [['createdAt', 'DESC']],
      })

      // Comptage agrégé du nombre de demandes par session (2e requête simple, sans SQL brut).
      const ids = sessions.map(s => s.id)
      let compteurs: Record<string, number> = {}
      if (ids.length > 0) {
        const rows: any[] = await RattrapageInscription.findAll({
          attributes: ['rattrapageSessionId', [fn('COUNT', col('id')), 'nb']],
          where: { rattrapageSessionId: { [Op.in]: ids } },
          group: ['rattrapageSessionId'],
          raw: true,
        })
        compteurs = Object.fromEntries(rows.map(r => [String(r.rattrapageSessionId), Number(r.nb)]))
      }

      const data = sessions.map(s => ({
        ...(s.toJSON() as object),
        nbDemandes: compteurs[String(s.id)] || 0,
      }))
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error('[listerSessions rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** GET /rattrapage-workflow/sessions/:id — détail complet d'une session. */
  static async detailSession(req: Request, res: Response): Promise<Response> {
    try {
      const session = await RattrapageSession.findByPk(req.params.id, {
        include: RattrapageWorkflowController.includesSession(true),
      })
      if (!session) return res.status(404).json({ success: false, message: 'Session de rattrapage introuvable' })
      return res.status(200).json({ success: true, data: session })
    } catch (error) {
      console.error('[detailSession rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DEMANDES ÉTUDIANTES — APPRENANT
  // ─────────────────────────────────────────────────────────────

  /** POST /rattrapage-workflow/demandes — soumet une demande pour une session ouverte. */
  static async creerDemande(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (role !== RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux étudiants' })
    }

    const body = req.body || {}
    const rattrapageSessionId = Number(body.rattrapageSessionId)
    if (!Number.isInteger(rattrapageSessionId) || rattrapageSessionId <= 0) {
      return res.status(400).json({ success: false, message: 'rattrapageSessionId est requis' })
    }

    try {
      const session = await RattrapageSession.findByPk(rattrapageSessionId)
      if (!session) return res.status(404).json({ success: false, message: 'Session de rattrapage introuvable' })
      // Garde-fou métier : seules les sessions « ouvertes » acceptent des demandes.
      if (session.statut !== 'ouverte') {
        return res.status(400).json({ success: false, message: 'La session de rattrapage n\'est pas ouverte aux demandes' })
      }

      // Une seule demande par étudiant pour une même session.
      const existante = await RattrapageInscription.findOne({
        where: { demandePar: req.utilisateurId, rattrapageSessionId },
      })
      if (existante) {
        return res.status(400).json({ success: false, message: 'Vous avez déjà soumis une demande pour cette session de rattrapage' })
      }

      // NB : coursParticipantId / coursId ne s'appliquent pas aux demandes de session
      // (rattrapage global par filières) — colonnes NULL en base pour ce type de demande.
      const payload: any = {
        source: 'demande_etudiant',
        statut: 'inscrit',
        statutDemande: 'en_attente',
        statutPaiement: 'impaye',
        rattrapageSessionId,
        motifEtudiant: typeof body.motifEtudiant === 'string' ? body.motifEtudiant : null,
        creneauSouhaite: typeof body.creneauSouhaite === 'string' ? body.creneauSouhaite : null,
        demandePar: req.utilisateurId,
      }
      const demande = await RattrapageInscription.create(payload)

      const full = await RattrapageInscription.findByPk(demande.id, {
        include: RattrapageWorkflowController.includesDemande(),
      })
      return res.status(201).json({ success: true, data: full })
    } catch (error) {
      console.error('[creerDemande rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** POST /rattrapage-workflow/demandes/:id/documents — téléverse un justificatif (propriétaire). */
  static async uploaderDocument(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (role !== RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux étudiants' })
    }

    const fichier = (req as any).file as Express.Multer.File | undefined
    if (!fichier) {
      return res.status(400).json({ success: false, message: 'Fichier requis (champ multipart \'fichier\')' })
    }

    const documentRequisId = Number(req.body?.documentRequisId)
    if (!Number.isInteger(documentRequisId) || documentRequisId <= 0) {
      RattrapageWorkflowController.nettoyerFichier(fichier.path)
      return res.status(400).json({ success: false, message: 'documentRequisId est requis' })
    }

    try {
      const demande = await RattrapageInscription.findByPk(req.params.id)
      if (!demande) {
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })
      }
      if (demande.demandePar !== req.utilisateurId) {
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas le propriétaire de cette demande' })
      }

      // Garde-fou : le justificatif doit appartenir à la session de la demande.
      if (!demande.rattrapageSessionId) {
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(400).json({ success: false, message: 'La demande n\'est rattachée à aucune session de rattrapage' })
      }
      const documentRequis = await RattrapageDocumentRequis.findOne({
        where: { id: documentRequisId, rattrapageSessionId: demande.rattrapageSessionId },
      })
      if (!documentRequis) {
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(400).json({ success: false, message: 'Le document requis n\'appartient pas à la session de cette demande' })
      }

      // Chemin relatif (cwd) : resolvable via path.resolve(process.cwd(), fichier).
      const cheminRelatif = `${RattrapageWorkflowController.CHEMIN_RATTRAPAGE}/${fichier.filename}`

      await RattrapageDocumentDepose.create({
        rattrapageInscriptionId: demande.id,
        documentRequisId,
        fichier: cheminRelatif,
      })

      const documents = await RattrapageDocumentDepose.findAll({
        where: { rattrapageInscriptionId: demande.id },
        include: [{ association: RattrapageDocumentDepose.associations.documentRequis }],
        order: [['createdAt', 'DESC']],
      })
      return res.status(201).json({ success: true, data: documents })
    } catch (error) {
      RattrapageWorkflowController.nettoyerFichier(fichier.path)
      console.error('[uploaderDocument rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LECTURE DES DEMANDES
  // ─────────────────────────────────────────────────────────────

  /** GET /rattrapage-workflow/demandes — mes demandes (apprenant) ou toutes (comité/admin). */
  static async listerDemandes(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role) return res.status(403).json({ success: false, message: 'Accès refusé' })

    const where: any = {
      source: 'demande_etudiant',
      rattrapageSessionId: { [Op.ne]: null },
    }

    if (role === RolesUtilisateur.APPRENANT) {
      where.demandePar = req.utilisateurId
    } else if (RattrapageWorkflowController.ROLE_VISION_TOTAL.includes(role)) {
      if (req.query.statutDemande) where.statutDemande = req.query.statutDemande
      if (req.query.rattrapageSessionId) where.rattrapageSessionId = Number(req.query.rattrapageSessionId)
    } else {
      return res.status(403).json({ success: false, message: 'Accès réservé aux étudiants ou au comité' })
    }

    try {
      const demandes = await RattrapageInscription.findAll({
        where,
        include: RattrapageWorkflowController.includesDemande(),
        order: [['createdAt', 'DESC']],
      })
      return res.status(200).json({ success: true, data: demandes })
    } catch (error) {
      console.error('[listerDemandes rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** GET /rattrapage-workflow/demandes/:id — détail d'une demande (propriétaire ou comité). */
  static async detailDemande(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role) return res.status(403).json({ success: false, message: 'Accès refusé' })

    try {
      const demande = await RattrapageInscription.findByPk(req.params.id, {
        include: RattrapageWorkflowController.includesDemande(),
      })
      if (!demande) return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })

      const estProprietaire = role === RolesUtilisateur.APPRENANT && demande.demandePar === req.utilisateurId
      if (!estProprietaire && !RattrapageWorkflowController.ROLE_VISION_TOTAL.includes(role)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' })
      }
      return res.status(200).json({ success: true, data: demande })
    } catch (error) {
      console.error('[detailDemande rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /**
   * GET /rattrapage-workflow/demandes/:id/documents/:documentDeposeId/telecharger
   * Sert un justificatif déposé (affichage inline) — propriétaire de la demande ou
   * comité/admin/comptable (ROLE_VISION_TOTAL). Le chemin stocké (`fichier`) est
   * relatif au process.cwd() (ex. public/inscription/rattrapage/<nanoid>.pdf).
   */
  static async telechargerDocument(req: Request, res: Response): Promise<Response | void> {
    const role = req.utilisateurRole
    if (!role) return res.status(403).json({ success: false, message: 'Accès refusé' })

    const demandeId = Number(req.params.id)
    const documentDeposeId = Number(req.params.documentDeposeId)
    if (
      !Number.isInteger(demandeId) || demandeId <= 0 ||
      !Number.isInteger(documentDeposeId) || documentDeposeId <= 0
    ) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' })
    }

    try {
      const document = await RattrapageDocumentDepose.findByPk(documentDeposeId, {
        include: [{ association: RattrapageDocumentDepose.associations.rattrapageInscription }],
      })
      // 404 volontaire (pas de fuite d'info) si le document n'existe pas ou s'il ne
      // dépend pas de la demande ciblée dans l'URL.
      if (!document || !document.rattrapageInscription || document.rattrapageInscriptionId !== demandeId) {
        return res.status(404).json({ success: false, message: 'Document introuvable pour cette demande' })
      }

      const demande = document.rattrapageInscription
      const estProprietaire = role === RolesUtilisateur.APPRENANT && demande.demandePar === req.utilisateurId
      if (!estProprietaire && !RattrapageWorkflowController.ROLE_VISION_TOTAL.includes(role)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' })
      }

      // Fichier stocké en chemin relatif (base process.cwd()) lors de l'upload.
      const filePath = path.resolve(process.cwd(), document.fichier)
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Fichier introuvable sur le serveur' })
      }

      const ext = path.extname(document.fichier) || '.pdf'
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      // Affichage inline (permet l'aperçu dans une iframe côté front comité),
      // même pattern que BordereauController.downloadBordereau.
      res.removeHeader('X-Frame-Options')
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `inline; filename="justificatif_rattrapage_${documentDeposeId}${ext}"`)

      const stream = fs.createReadStream(filePath)
      stream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
        } else {
          res.end()
        }
      })
      stream.pipe(res)
    } catch (error) {
      console.error('[telechargerDocument rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. DÉCISION DU COMITÉ (valider / rejeter)
  // ─────────────────────────────────────────────────────────────

  /** PUT /rattrapage-workflow/demandes/:id/valider — valide la demande (débloque le paiement côté front). */
  static async validerDemande(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role || !RattrapageWorkflowController.ROLE_COMITE.includes(role)) {
      return res.status(403).json({ success: false, message: 'Validation réservée au comité' })
    }

    try {
      const demande = await RattrapageInscription.findByPk(req.params.id)
      if (!demande) return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })

      await demande.update({
        statutDemande: 'valide',
        dateValidationComite: new Date(),
        motifRejet: null,
      })

      const full = await RattrapageInscription.findByPk(demande.id, {
        include: RattrapageWorkflowController.includesDemande(),
      })
      return res.status(200).json({ success: true, data: full })
    } catch (error) {
      console.error('[validerDemande rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** PUT /rattrapage-workflow/demandes/:id/rejeter — rejette avec motif obligatoire. */
  static async rejeterDemande(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role || !RattrapageWorkflowController.ROLE_COMITE.includes(role)) {
      return res.status(403).json({ success: false, message: 'Rejet réservé au comité' })
    }

    const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : ''
    if (!motif) {
      return res.status(400).json({ success: false, message: 'Le motif de rejet est requis' })
    }

    try {
      const demande = await RattrapageInscription.findByPk(req.params.id)
      if (!demande) return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })

      await demande.update({
        statutDemande: 'rejete',
        motifRejet: motif,
        dateValidationComite: new Date(),
      })

      const full = await RattrapageInscription.findByPk(demande.id, {
        include: RattrapageWorkflowController.includesDemande(),
      })
      return res.status(200).json({ success: true, data: full })
    } catch (error) {
      console.error('[rejeterDemande rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. PAIEMENT — dépôt de bordereau (apprenant) puis confirmation (comptable/admin)
  // ─────────────────────────────────────────────────────────────

  /** POST /rattrapage-workflow/demandes/:id/bordereau — dépose le bordereau de frais (propriétaire). */
  static async deposerBordereau(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (role !== RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux étudiants' })
    }

    const fichier = (req as any).file as Express.Multer.File | undefined
    if (!fichier) {
      return res.status(400).json({ success: false, message: 'Fichier bordereau requis (champ multipart \'fichier\')' })
    }

    // Montant des frais de rattrapage = paramètre global 'frais_rattrapage'.
    const parametre = await ParametreFrais.findOne({ where: { cle: 'frais_rattrapage' } })
    if (!parametre) {
      RattrapageWorkflowController.nettoyerFichier(fichier.path)
      return res.status(400).json({
        success: false,
        message: 'Les frais de rattrapage ne sont pas configurés — paramètre global \'frais_rattrapage\' manquant',
      })
    }
    const montant = Number(parametre.valeur)
    if (!Number.isFinite(montant) || montant <= 0) {
      RattrapageWorkflowController.nettoyerFichier(fichier.path)
      return res.status(400).json({ success: false, message: 'Le paramètre \'frais_rattrapage\' doit être un montant strictement positif' })
    }

    const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
    try {
      const demande = await RattrapageInscription.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!demande) {
        await transaction.rollback()
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })
      }
      if (demande.demandePar !== req.utilisateurId) {
        await transaction.rollback()
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas le propriétaire de cette demande' })
      }
      // Le dépôt de bordereau n'est possible qu'après validation du comité.
      if (demande.statutDemande !== 'valide') {
        await transaction.rollback()
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(400).json({ success: false, message: 'La demande doit être validée par le comité avant le paiement' })
      }
      if (demande.bordereauId) {
        await transaction.rollback()
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(400).json({ success: false, message: 'Un bordereau a déjà été déposé pour cette demande' })
      }
      if (demande.statutPaiement === 'paye') {
        await transaction.rollback()
        RattrapageWorkflowController.nettoyerFichier(fichier.path)
        return res.status(400).json({ success: false, message: 'Paiement déjà confirmé pour cette demande' })
      }

      // Bordereau de type 'rattrapage' : valeur ajoutée à l'ENUM du modèle Bordereau.
      // Ce type n'est PAS traité par la validation classique (garde explicite dans
      // BordereauController.validerBordereau) — seule la confirmation de paiement du
      // workflow (confirmerPaiement) le fait passer à 'valide'.
      const bordereau = await Bordereau.create({
        type: 'rattrapage',
        utilisateurId: demande.demandePar ?? req.utilisateurId,
        fichier: fichier.filename,
        montant,
        modalite: '1x',
        referenceBancaire: `rattrapage-workflow-${demande.id}`,
        statut: 'en_attente',
        commentaire: `Frais de rattrapage — demande #${demande.id} (workflow officiel)`,
      }, { transaction })

      await demande.update({ bordereauId: bordereau.id, montant }, { transaction })
      await transaction.commit()

      const full = await Bordereau.findByPk(bordereau.id)
      return res.status(201).json({ success: true, data: full })
    } catch (error) {
      await transaction.rollback()
      RattrapageWorkflowController.nettoyerFichier(fichier.path)
      console.error('[deposerBordereau rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  /** PUT /rattrapage-workflow/demandes/:id/confirmer-paiement — inscription définitive (comptable/admin). */
  static async confirmerPaiement(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role || !RattrapageWorkflowController.ROLE_PAIEMENT.includes(role)) {
      return res.status(403).json({ success: false, message: 'Confirmation de paiement réservée au cabinet comptable ou à l\'administration' })
    }

    const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
    try {
      const demande = await RattrapageInscription.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!demande) {
        await transaction.rollback()
        return res.status(404).json({ success: false, message: 'Demande de rattrapage introuvable' })
      }
      if (!demande.bordereauId) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: 'Aucun bordereau de paiement déposé pour cette demande' })
      }
      if (demande.statutPaiement === 'paye') {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: 'Paiement déjà confirmé pour cette demande' })
      }

      const bordereau = await Bordereau.findByPk(demande.bordereauId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!bordereau) {
        await transaction.rollback()
        return res.status(404).json({ success: false, message: 'Bordereau de paiement introuvable' })
      }
      if (bordereau.statut !== 'en_attente') {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: 'Bordereau déjà traité' })
      }

      // Bordereau validé + paiement confirmé + cohérence historique (paiementId).
      await bordereau.update({
        statut: 'valide',
        dateValidation: new Date(),
        valideParId: req.utilisateurId,
      }, { transaction })
      await demande.update({
        statutPaiement: 'paye',
        paiementId: bordereau.id,
      }, { transaction })

      await transaction.commit()

      const full = await RattrapageInscription.findByPk(demande.id, {
        include: RattrapageWorkflowController.includesDemande(),
      })
      return res.status(200).json({ success: true, data: full })
    } catch (error) {
      await transaction.rollback()
      console.error('[confirmerPaiement rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DOCUMENTS REQUIS D'UNE SESSION (affichage upload côté étudiant)
  // ─────────────────────────────────────────────────────────────

  /** GET /rattrapage-workflow/documents-requis/:sessionId — pièces requises d'une session. */
  static async documentsRequisSession(req: Request, res: Response): Promise<Response> {
    const role = req.utilisateurRole
    if (!role) return res.status(403).json({ success: false, message: 'Accès refusé' })

    try {
      const documents = await RattrapageDocumentRequis.findAll({
        where: { rattrapageSessionId: req.params.sessionId },
        order: [['ordre', 'ASC'], ['id', 'ASC']],
      })
      return res.status(200).json({ success: true, data: documents })
    } catch (error) {
      console.error('[documentsRequisSession rattrapage-workflow]', error)
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
    }
  }
}
import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeDocument } from "../models/DemandeDocument";
import { TypeDocument } from "../models/TypeDocument";
import { DocumentDelivre } from "../models/DocumentDelivre";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import DemandeDocumentPaiementService from "../services/DemandeDocumentPaiementService";
import { SecretariatWorkflowService, ErreurWorkflow } from "../services/SecretariatWorkflowService";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class DemandeDocumentController {

    constructor() { }

    static async getAllDemandesDocument(req: Request, res: Response): Promise<Response> {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        const offset = (page - 1) * limit

        const where: any = {}

        if (req.query.statut) where.statut = req.query.statut
        if (req.query.typeDocumentId) where.typeDocumentId = req.query.typeDocumentId
        if (req.query.parcoursId) where.parcoursId = req.query.parcoursId
        if (req.query.niveauEtudeId) where.niveauEtudeId = req.query.niveauEtudeId
        if (req.query.anneeAcademiqueId) where.anneeAcademiqueId = req.query.anneeAcademiqueId
        if (req.query.classeId) where.classeId = req.query.classeId

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.etudiantId = (req as any).utilisateurId
        }

        const orderBy = (req.query.orderBy as string) || 'createdAt'
        const orderDir = (req.query.orderDir as string) || 'DESC'
        const order = [[orderBy, orderDir]] as any

        try {
            const { rows, count: total } = await DemandeDocument.findAndCountAll({
                where,
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: DocumentDelivre, as: 'documentDelivre' }
                ],
                order,
                limit,
                offset
            })

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async getDemandeDocument(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeDocument>> = {
            where: { id: req.params.id },
            include: [
                { model: TypeDocument, as: 'typeDocument' },
                { model: DocumentDelivre, as: 'documentDelivre' }
            ]
        }

        try {
            const demande: DemandeDocument | null = await DemandeDocument.findOne(options);

            if (demande == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demande);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        if (!req.body.typeDocumentId) {
            return res.status(400).json({ success: false, message: "typeDocumentId requis" });
        }

        // Règle métier : toute demande soumise par un étudiant est une demande volontaire.
        // Le montant est le frais paramétré sur le TypeDocument (0 = gratuit).
        const typeDocument = await TypeDocument.findByPk(req.body.typeDocumentId)
        const montant = Number(typeDocument?.frais) || 0

        let demande: DemandeDocument = new DemandeDocument();
        demande.etudiantId = (req as any).utilisateurId
        demande.typeDocumentId = req.body.typeDocumentId
        demande.statut = 'soumise'
        demande.source = 'demande_etudiant'
        demande.montant = montant
        // Gratuit si aucun frais paramétré, sinon en attente de paiement
        demande.fraisPayes = montant <= 0
        demande.compteProduit = '704'

        await demande.save()
            .then(async (demande) => {
                try {
                    const cursus = await CursusApprenant.findOne({
                        where: { utilisateurId: (req as any).utilisateurId }
                    })
                    if (cursus) {
                        await demande.update({
                            parcoursId: cursus.parcoursId ? Number(cursus.parcoursId) : null,
                            niveauEtudeId: cursus.niveauEtudeId ? Number(cursus.niveauEtudeId) : null,
                            classeId: cursus.classeId ? Number(cursus.classeId) : null,
                            anneeAcademiqueId: cursus.anneeAcademiqueId ? Number(cursus.anneeAcademiqueId) : null
                        })
                    }
                } catch (e) {
                    console.error('Could not populate CursusApprenant fields:', e)
                }
                return res.status(201).send(demande);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async traiterDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demande: DemandeDocument | null = await DemandeDocument.findOne({
            where: { id: req.params.id },
            include: [{ model: TypeDocument, as: 'typeDocument' }]
        });

        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

            if (req.body.statut == 'validee' || req.body.statut == 'delivree') {
            // Règle métier : une demande volontaire payante doit être réglée avant
            // validation / délivrance du document.
            if (demande.source === 'demande_etudiant' && !demande.fraisPayes) {
                return res.status(400).json({ success: false, message: "Paiement requis avant délivrance du document" });
            }

            let typeDocument = demande.typeDocument
            if (!typeDocument) {
                typeDocument = (await TypeDocument.findOne({ where: { id: demande.typeDocumentId } })) ?? undefined
            }

            const filename = DocumentPDFGenerator.generateDocument(
                demande.id,
                typeDocument?.libelle || 'Document',
                "public/scolarite/documents/"
            )

            let docDelivre = new DocumentDelivre();
            docDelivre.demandeId = demande.id
            docDelivre.fichierPDF = filename
            await docDelivre.save()

            // Archivage avec le service dédié (plus de champs contextuels renseignés)
            const aai = Number(demande.anneeAcademiqueId) || 0;
            const pi = Number(demande.parcoursId) || 0;
            const nei = Number(demande.niveauEtudeId) || 0;
            if (aai && pi && nei) {
                ArchiveGedService.archiverDocumentScolarite({
                    titre: `${typeDocument?.libelle || 'Document'} - ${demande.id}`,
                    documentTypeCode: 'attestation',
                    fichier: filename,
                    anneeAcademiqueId: aai,
                    parcoursId: pi,
                    niveauEtudeId: nei,
                    classeId: Number(demande.classeId) || undefined,
                    semestre: undefined,
                    cursusApprenantId: undefined,
                    uploaderId: (req as any).utilisateurId || 1,
                }).catch((err: any) => console.error("Erreur archivage document scolarite:", err));
            }
        }

        await demande.update({ statut: req.body.statut })
            .then(async (demande) => {
                return res.status(200).send(demande);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async deleteDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let demande: DemandeDocument | null = await DemandeDocument.findOne({ where: { id: req.params.id } });
        if (demande) {
            await demande.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeDocument.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        const { ids, statut } = req.body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "ids must be a non-empty array" })
        }

        const validStatuts = ['validee', 'rejetee', 'delivree']
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ success: false, message: "statut must be one of: validee, rejetee, delivree" })
        }

        if (statut === 'validee' || statut === 'delivree') {
            const demandes = await DemandeDocument.findAll({ where: { id: ids } })
            const nonPayees = demandes.filter(d =>
                d.source === 'demande_etudiant' && !d.fraisPayes && Number(d.montant) > 0
            )
            if (nonPayees.length > 0) {
                return res.status(400).json({ success: false, message: "Paiement requis avant délivrance du document" })
            }
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
        try {
            const [count] = await DemandeDocument.update(
                { statut },
                { where: { id: ids }, transaction }
            )
            await transaction.commit()
            return res.json({ success: true, count })
        } catch (error) {
            await transaction.rollback()
            return res.status(500).json({ success: false, error })
        }
    }

    static async creerBordereauDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        if (montant <= 0) {
            return res.status(400).json({ success: false, message: "Aucun frais à payer pour cette demande" })
        }
        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        const bordereauExistant = await DemandeDocumentPaiementService.trouverBordereauDemande(demande)
        if (bordereauExistant) {
            return res.status(400).json({ success: false, message: "Un bordereau existe déjà pour cette demande" })
        }

        try {
            const bordereau = await DemandeDocumentPaiementService.creerBordereauPourDemande(demande, utilisateurId)
            return res.status(201).send(bordereau)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async confirmerPaiementDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.CAISSIER_BANQUE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        try {
            const demandeMaj = await DemandeDocumentPaiementService.confirmerPaiement(demande, {
                paiementId: req.body.paiementId
            })
            return res.status(200).send(demandeMaj)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async confirmerPaiementAutoDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        if (montant <= 0) {
            return res.status(400).json({ success: false, message: "Aucun frais à payer pour cette demande" })
        }
        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        try {
            const demandeMaj = await DemandeDocumentPaiementService.confirmerPaiementAuto(demande, req)
            return res.status(200).send(demandeMaj)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async verifierAccesDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        return res.status(200).json({
            gratuit: montant <= 0 || demande.source === 'automatique',
            montant,
            fraisPayes: !!demande.fraisPayes,
            source: demande.source
        })
    }

    static async preparerDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.passerEnPreparation(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][preparerDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la préparation" })
        }
    }

    static async genererDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id, {
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: Utilisateur, as: 'etudiant' }
                ]
            })
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.genererDocument(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][genererDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la génération" })
        }
    }

    static async imprimerDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.confirmerImpression(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][imprimerDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la confirmation d'impression" })
        }
    }

    static async remettreDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id, {
                include: [{ model: Utilisateur, as: 'etudiant' }]
            })
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.confirmerRemise(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][remettreDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la remise" })
        }
    }

    static async rejeterDemande(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        const motif = req.body.motif || "Demande rejetée"

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.rejeterDemande(demande, motif, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][rejeterDemande] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors du rejet" })
        }
    }
}

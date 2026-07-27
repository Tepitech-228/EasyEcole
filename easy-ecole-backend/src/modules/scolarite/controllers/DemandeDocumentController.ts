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

        let demande: DemandeDocument = new DemandeDocument();
        demande.etudiantId = (req as any).utilisateurId
        demande.typeDocumentId = req.body.typeDocumentId
        demande.statut = 'soumise'
        demande.fraisPayes = req.body.fraisPayes || false

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

            ArchiveGedService.archiverDepuisFichier({
                fichierSource: `public/scolarite/documents/${filename}`,
                domaineCode: 'SCOL',
                typeDocumentCode: 'attestation',
                processusCode: 'SCOLARITE_DEMANDE',
                processusLibelle: 'Demande de scolarité',
                processusModule: 'scolarite',
                titre: `${typeDocument?.libelle || 'Document'} - ${demande.id}`,
                dossierGed: 'Scolarité',
                sousDossierGed: 'Documents de scolarité',
                sourceType: 'genere_application',
                confidentialite: 'interne',
            }).catch(err => console.error("Erreur archivage document scolarite:", err))
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
}

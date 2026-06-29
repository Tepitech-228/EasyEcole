import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeDocument } from "../models/DemandeDocument";
import { TypeDocument } from "../models/TypeDocument";
import { DocumentDelivre } from "../models/DocumentDelivre";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";

export default class DemandeDocumentController {

    constructor() { }

    static async getAllDemandesDocument(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeDocument>> = {
            include: [
                { model: TypeDocument, as: 'typeDocument' },
                { model: DocumentDelivre, as: 'documentDelivre' }
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { ...options, where: { etudiantId: (req as any).utilisateurId } }
        }

        try {
            let demandes: DemandeDocument[];
            demandes = await DemandeDocument.findAll(options);

            return res.status(200).send(demandes);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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
}

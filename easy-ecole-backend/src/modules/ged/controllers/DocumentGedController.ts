import { Request, Response } from "express";
import { DocumentGed } from "../models/DocumentGed";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { OcrService } from "../../../core/services/OcrService";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";

function parseJsonField(value: any): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

const UPLOAD_DIR = "public/ged";

export default class DocumentGedController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const { statut, folderId, q } = req.query;
            const where: any = {};
            if (statut) where.statut = statut;
            if (folderId) where.folderId = Number(folderId);

            if (q) {
                const query = String(q);
                where[Op.or] = [
                    { titre: { [Op.like]: `%${query}%` } },
                    { reference: { [Op.like]: `%${query}%` } },
                    { nommage: { [Op.like]: `%${query}%` } },
                    { tags: { [Op.like]: `%${query}%` } },
                    { contenuTexte: { [Op.like]: `%${query}%` } },
                    { auteur: { [Op.like]: `%${query}%` } }
                ];
            }

            const documents = await DocumentGed.findAll({
                where,
                include: [{ association: DocumentGed.associations.uploader, attributes: ['id', 'nom', 'prenoms'] }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json(documents);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const document = await DocumentGed.findByPk(req.params.id, {
                include: [{ association: DocumentGed.associations.uploader, attributes: ['id', 'nom', 'prenoms'] }]
            });
            if (!document)
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async upload(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const file = req.file;
            if (!file)
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
            const folderId = req.body.folderId;
            let finalFilename = file.filename;
            if (folderId) {
                const folderPath = path.resolve(process.cwd(), UPLOAD_DIR, String(folderId));
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                const oldPath = path.resolve(process.cwd(), UPLOAD_DIR, file.filename);
                const newPath = path.resolve(folderPath, file.filename);
                fs.renameSync(oldPath, newPath);
                finalFilename = path.join(String(folderId), file.filename).replace(/\\/g, '/');
            }

            // OCR extraction
            const fullPath = path.resolve(process.cwd(), UPLOAD_DIR, finalFilename);
            const ocrData = await OcrService.extraireMetadonnees(fullPath);

            const document = await DocumentGed.create({
                titre: req.body.titre || file.originalname,
                reference: req.body.reference || null,
                eleve: req.body.eleve || null,
                parcours: req.body.parcours || null,
                categorie: req.body.categorie || null,
                tags: req.body.tags || ocrData.motsCles.join(', '),
                nommage: req.body.nommage || null,
                type: req.body.type || (file.mimetype.includes('tiff') ? 'TIFF' : 'PDF'),
                statut: req.body.statut || 'Disponible',
                fichier: finalFilename,
                taille: `${(file.size / 1024).toFixed(1)} Ko`,
                uploaderId: (req as any).utilisateurId,
                folderId: folderId || undefined,
                sessionId: req.body.sessionId ? Number(req.body.sessionId) : undefined,
                metadata: parseJsonField(req.body.metadata) || null,
                dureeConservation: req.body.dureeConservation || null,
                archivedUntil: req.body.archivedUntil || null,
                isArchived: req.body.isArchived === 'true' || req.body.isArchived === true,
                nbPages: ocrData.nbPages || undefined,
                auteur: ocrData.auteur || undefined,
                dateDocument: ocrData.dateDocument ? new Date(ocrData.dateDocument) : undefined,
                contenuTexte: ocrData.contenuTexte || undefined
            });

            return res.status(201).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document)
                return res.status(404).json({ success: false, message: "Document non trouvé" });

            const updatableFields = [
                'titre', 'reference', 'eleve', 'parcours', 'categorie',
                'tags', 'nommage', 'statut', 'dureeConservation',
                'archivedUntil', 'isArchived', 'metadata', 'folderId'
            ];
            const updates: any = {};
            for (const field of updatableFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = field === 'metadata'
                        ? parseJsonField(req.body[field])
                        : req.body[field];
                }
            }

            if (req.file) {
                const oldPath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

                const folderId = req.body.folderId || document.folderId;
                let finalFilename = req.file.filename;
                if (folderId) {
                    const folderPath = path.resolve(process.cwd(), UPLOAD_DIR, String(folderId));
                    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                    const tmpPath = path.resolve(process.cwd(), UPLOAD_DIR, req.file.filename);
                    const newPath = path.resolve(folderPath, req.file.filename);
                    fs.renameSync(tmpPath, newPath);
                    finalFilename = path.join(String(folderId), req.file.filename).replace(/\\/g, '/');
                }
                updates.fichier = finalFilename;
                updates.taille = `${(req.file.size / 1024).toFixed(1)} Ko`;

                const fullPath = path.resolve(process.cwd(), UPLOAD_DIR, finalFilename);
                const ocrData = await OcrService.extraireMetadonnees(fullPath);
                updates.nbPages = ocrData.nbPages || undefined;
                updates.auteur = ocrData.auteur || undefined;
                updates.dateDocument = ocrData.dateDocument ? new Date(ocrData.dateDocument) : undefined;
                updates.contenuTexte = ocrData.contenuTexte || undefined;
            }

            await document.update(updates);
            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async download(req: Request, res: Response): Promise<void> {
        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                res.status(404).json({ success: false, message: "Document non trouvé" });
                return;
            }

            const filePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable" });
                return;
            }

            const ext = path.extname(document.fichier).toLowerCase();
            const contentType = ext === '.tiff' || ext === '.tif' ? 'image/tiff' : 'application/pdf';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${document.titre}${ext}"`);
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, error });
        }
    }

    static async exportPdf(req: Request, res: Response): Promise<void> {
        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                res.status(404).json({ success: false, message: "Document non trouvé" });
                return;
            }

            const outputDir = path.resolve(process.cwd(), UPLOAD_DIR, 'pdf');
            const filename = await DocumentPDFGenerator.generateGedSummary(document, outputDir);
            const filePath = path.resolve(outputDir, filename);
            if (!fs.existsSync(filePath)) {
                res.status(500).json({ success: false, message: "Impossible de générer le PDF" });
                return;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${document.titre.replace(/\s+/g, '_')}.pdf"`);
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document)
                return res.status(404).json({ success: false, message: "Document non trouvé" });

            const filePath = path.join(process.cwd(), UPLOAD_DIR, document.fichier);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await document.destroy();
            return res.status(200).json({ success: true, message: "Document supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

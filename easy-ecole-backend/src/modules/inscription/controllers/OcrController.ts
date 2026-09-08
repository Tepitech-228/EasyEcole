import { Request, Response } from "express";
import { OcrExtractionService, DocumentSoumis } from "../services/OcrExtractionService";
import { QUEUE_NAMES, QueueService } from "../../../core/queue/QueueService";

/**
 * Contrôleur d'extraction OCR/ICR pour le wizard d'inscription.
 * Reçoit les pièces téléversées, lance l'extraction et retourne les informations
 * personnelles pré-remplies à destination du formulaire de l'étudiant.
 */
export default class OcrController {

    static async preRemplissageAsync(req: Request, res: Response): Promise<Response> {
        const fichiers = (req.files as Express.Multer.File[]) || [];
        if (fichiers.length === 0) {
            return res.status(400).json({ success: false, message: "Aucun document à analyser." });
        }

        try {
            const queue = QueueService.getInstance();
            const jobs = await Promise.all(fichiers.map((fichier) => queue.add(
                QUEUE_NAMES.OCR,
                { filePath: fichier.path },
            )));
            return res.status(202).json({
                success: true,
                status: 'queued',
                jobIds: jobs.map((job) => job.id),
            });
        } catch (error) {
            await Promise.all(fichiers.map((fichier) => import('fs/promises').then((fs) => fs.unlink(fichier.path).catch(() => undefined))));
            return res.status(503).json({ success: false, message: 'File OCR indisponible' });
        }
    }

    /**
     * POST /inscription/ocr/pre-remplissage
     * Body multipart : champs 'documents' (multi-fichiers).
     * Retour : { success, data: InfoPersonnelles }
     */
    static async preRemplissage(req: Request, res: Response): Promise<Response> {
        try {
            const fichiers = (req.files as Express.Multer.File[]) || [];
            if (fichiers.length === 0) {
                return res.status(400).json({ success: false, message: "Aucun document à analyser." });
            }

            const documents: DocumentSoumis[] = fichiers.map((f) => ({
                nomFichier: f.originalname,
                chemin: f.path,
                mimeType: f.mimetype,
            }));

            const infos = await OcrExtractionService.getInstance().extraireInfos(documents);
            return res.status(200).json({ success: true, data: infos });
        } catch (error) {
            console.error("Erreur OCR pré-remplissage:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'extraction des informations." });
        }
    }
}

import { Request, Response } from "express";
import path from "path";
import { Support } from "../models/Support";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { CouplageMail } from "../models/CouplageMail";

export default class SupportController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const supports = await Support.findAll({
                where: { moduleId: req.params.moduleId }
            });
            return res.status(200).send(supports);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const support = await Support.findByPk(req.params.id);
            if (!support)
                return res.status(404).json({ success: false, message: "Support non trouvé" });

            return res.status(200).send(support);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async upload(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const file = req.file;
            if (!file)
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

            const type = req.body.type || 'document';
            const support = await Support.create({
                moduleId: req.body.moduleId,
                type: type,
                fichierOriginal: file.filename,
                taille: `${(file.size / 1024).toFixed(2)} Ko`
            });

            if (type === 'video') {
                SupportController.compressVideo(file.filename, support.id);
            }

            SupportController.notifierInscrits(support);

            return res.status(201).send(support);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const support = await Support.findByPk(req.params.id);
            if (!support)
                return res.status(404).json({ success: false, message: "Support non trouvé" });

            await support.destroy();
            return res.status(200).json({ success: true, message: "Support supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    private static async compressVideo(filename: string, supportId: string): Promise<void> {
        try {
            const ffmpeg = require('fluent-ffmpeg');
            const inputPath = path.join('public/elearning/videos/', filename);
            const outputFilename = `compressed_${filename}.mp4`;
            const outputPath = path.join('public/elearning/videos/compressed/', outputFilename);

            ffmpeg(inputPath)
                .videoCodec('libx264')
                .size('1280x720')
                .outputOptions('-preset fast')
                .on('end', async () => {
                    await Support.update(
                        { fichierCompresse: outputFilename },
                        { where: { id: supportId } }
                    );
                })
                .on('error', (err: Error) => {
                    console.error('Erreur compression vidéo:', err);
                })
                .save(outputPath);
        } catch (error) {
            console.error('FFmpeg non disponible:', error);
        }
    }

    private static async notifierInscrits(support: Support): Promise<void> {
        try {
            const emailSender = EmailSender.getInstance();
            await emailSender.sendMail({
                to: '',
                subject: 'Nouveau support disponible',
                html: `<p>Un nouveau support a été ajouté au module.</p>`
            });

            await CouplageMail.create({
                supportId: support.id,
                emailEnvoye: 'automatique'
            });
        } catch (error) {
            console.error('Erreur envoi notification:', error);
        }
    }
}

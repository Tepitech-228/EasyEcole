import { Request, Response } from "express";
import path from "path";
import { Support } from "../models/Support";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { CouplageMail } from "../models/CouplageMail";
import { ModuleElearning } from "../models/ModuleElearning";
import ElearningAccessService from "../services/ElearningAccessService";
import { SelectionCours } from "../models/SelectionCours";
import fs from "fs";
import ElearningFinanceService from "../services/ElearningFinanceService";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { Op } from "sequelize";

const SUPPORT_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "supports");

export default class SupportController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const role = String((req as any).utilisateurRole);
            const utilisateurId = Number((req as any).utilisateurId);
            const moduleId = Number(req.query.moduleId || 0);
            const where: Record<string, unknown> = {};
            if (moduleId) {
                if (!await ElearningAccessService.canAccessModule(utilisateurId, role, moduleId)) {
                    return res.status(403).json({ success: false, message: "Accès au cours non autorisé." });
                }
                where.moduleId = moduleId;
            } else if (role === RolesUtilisateur.APPRENANT) {
                const selections = await SelectionCours.findAll({
                    where: { utilisateurId, statut: "acces_ouvert" },
                    attributes: ["coursId"],
                });
                const modules = await ModuleElearning.findAll({
                    where: { coursId: selections.map(selection => Number(selection.coursId)) },
                    attributes: ["id"],
                });
                where.moduleId = modules.map(module => Number(module.id));
            } else if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                const courses = await CoursEnLigne.findAll({
                    where: { [Op.or]: [{ professeurId: utilisateurId }, { enseignantId: utilisateurId }, { chargeSupportId: utilisateurId }] },
                    attributes: ["id"],
                });
                const modules = await ModuleElearning.findAll({
                    where: { coursId: courses.map(course => Number(course.id)) },
                    attributes: ["id"],
                });
                where.moduleId = modules.map(module => Number(module.id));
            }
            const supports = await Support.findAll({ where });
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
            if (!await ElearningAccessService.canAccessModule(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(support.moduleId)
            )) return res.status(403).json({ success: false, message: "Accès au cours non autorisé." });

            return res.status(200).send(support);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async upload(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = Number((req as any).utilisateurId);
            const role = String((req as any).utilisateurRole);
            const file = req.file;
            if (!file)
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
            const module = await ModuleElearning.findByPk(Number(req.body.moduleId));
            if (!module) {
                await fs.promises.unlink(file.path);
                return res.status(404).json({ success: false, message: "Module introuvable." });
            }
            if (!await ElearningAccessService.canManageCourse(utilisateurId, role, Number(module.coursId))) {
                await fs.promises.unlink(file.path).catch(error => console.error("[E-learning] Échec de suppression du fichier non autorisé:", error));
                return res.status(403).json({ success: false, message: "Vous ne pouvez pas publier dans ce cours." });
            }

            const type = req.body.type || 'document';
            const support = await Support.create({
                moduleId: req.body.moduleId,
                type: type,
                fichierOriginal: file.filename,
                cheminFichier: path.relative(process.cwd(), file.path),
                accessibilite: "paye",
                taille: `${(file.size / 1024).toFixed(2)} Ko`
            });

            if (type === 'video') {
                SupportController.compressVideo(file.filename, support.id);
            }

            await ElearningFinanceService.recordAudit(utilisateurId, role, "support.ajoute", "support", Number(support.id), { moduleId: module.id, type });
            SupportController.notifierInscrits(support);

            return res.status(201).send(support);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async download(req: Request, res: Response): Promise<void> {
        try {
            const support = await Support.findByPk(req.params.id);
            if (!support) { res.status(404).json({ success: false, message: "Support non trouvé." }); return; }
            if (!await ElearningAccessService.canAccessModule(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(support.moduleId)
            )) { res.status(403).json({ success: false, message: "Accès au cours non autorisé." }); return; }
            const compressed = req.query.qualite === "hd" && support.fichierCompresse;
            const relative = compressed
                ? path.join("public", "elearning", "protected", "supports", "compressed", path.basename(support.fichierCompresse as string))
                : support.cheminFichier || path.join("public", "elearning", "videos", path.basename(support.fichierOriginal));
            const filePath = path.resolve(process.cwd(), relative);
            const basePath = path.resolve(process.cwd(), "public", "elearning");
            if (!filePath.startsWith(`${basePath}${path.sep}`) || !fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier de support introuvable." });
                return;
            }
            res.sendFile(filePath);
        } catch (error) {
            console.error("[E-learning] Erreur de téléchargement du support:", error);
            res.status(500).json({ success: false, message: "Impossible de servir ce support." });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const support = await Support.findByPk(req.params.id);
            if (!support)
                return res.status(404).json({ success: false, message: "Support non trouvé" });
            const module = await ModuleElearning.findByPk(Number(support.moduleId));
            if (!module || !await ElearningAccessService.canManageCourse(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(module.coursId)
            )) return res.status(403).json({ success: false, message: "Gestion du cours non autorisée." });

            await support.destroy();
            return res.status(200).json({ success: true, message: "Support supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    private static async compressVideo(filename: string, supportId: string): Promise<void> {
        try {
            const ffmpeg = require('fluent-ffmpeg');
            const inputPath = path.join(SUPPORT_DIR, filename);
            const outputFilename = `compressed_${filename}.mp4`;
            const outputPath = path.join(SUPPORT_DIR, "compressed", outputFilename);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

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

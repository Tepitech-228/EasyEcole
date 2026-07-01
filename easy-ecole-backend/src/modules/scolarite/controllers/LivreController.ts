import { Request, Response } from "express";
import path from "path";
import { Op } from "sequelize";
import { Livre } from "../models/Livre";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Notification } from "../../elearning/models/Notification";

const UPLOAD_DIR = "public/bibliotheque";

export default class LivreController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const livres = await Livre.findAll({
                include: [{ association: Livre.associations.uploader, attributes: ['id'] }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).send(livres);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const livre = await Livre.findByPk(req.params.id, {
                include: [{ association: Livre.associations.uploader, attributes: ['id'] }]
            });
            if (!livre)
                return res.status(404).json({ success: false, message: "Livre non trouvé" });
            return res.status(200).send(livre);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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

            const livre = await Livre.create({
                titre: req.body.titre,
                auteur: req.body.auteur || 'Inconnu',
                description: req.body.description || null,
                fichier: file.filename,
                taille: `${(file.size / 1024).toFixed(1)} Ko`,
                uploaderId: (req as any).utilisateurId,
                consultations: 0,
            });

            return res.status(201).send(livre);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const livre = await Livre.findByPk(req.params.id);
            if (!livre)
                return res.status(404).json({ success: false, message: "Livre non trouvé" });

            const filePath = path.join(process.cwd(), UPLOAD_DIR, livre.fichier);
            try {
                const fs = require('fs');
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch {}

            await livre.destroy();
            return res.status(200).json({ success: true, message: "Livre supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async download(req: Request, res: Response): Promise<void> {
        try {
            const livre = await Livre.findByPk(req.params.id);
            if (!livre) {
                res.status(404).json({ success: false, message: "Livre non trouvé" });
                return;
            }

            const filePath = path.resolve(process.cwd(), UPLOAD_DIR, livre.fichier);
            const fs = require('fs');
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable" });
                return;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${livre.titre}.pdf"`);
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, error: error });
        }
    }

    static async consulter(req: Request, res: Response): Promise<Response> {
        try {
            const livre = await Livre.findByPk(req.params.id);
            if (!livre)
                return res.status(404).json({ success: false, message: "Livre non trouvé" });

            await livre.update({ consultations: (livre.consultations || 0) + 1 });

            const utilisateurId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole;

            if (role === RolesUtilisateur.APPRENANT || role === RolesUtilisateur.ENSEIGNANT) {
                const utilisateur = await Utilisateur.findByPk(utilisateurId, {
                    attributes: ['nom', 'prenoms']
                });

                const admins = await Utilisateur.findAll({
                    where: {
                        role: { [Op.in]: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] }
                    },
                    attributes: ['id']
                });

                for (const admin of admins) {
                    await Notification.create({
                        utilisateurId: parseInt(admin.id),
                        type: 'bibliotheque',
                        message: `${utilisateur?.prenoms} ${utilisateur?.nom} a consulté le livre "${livre.titre}"`
                    });
                }
            }

            return res.status(200).json({ success: true, consultations: livre.consultations });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getFichierInfo(req: Request, res: Response): Promise<Response> {
        try {
            const livre = await Livre.findByPk(req.params.id, { attributes: ['fichier'] });
            if (!livre)
                return res.status(404).json({ success: false, message: "Livre non trouvé" });

            return res.status(200).json({ fichier: livre.fichier });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

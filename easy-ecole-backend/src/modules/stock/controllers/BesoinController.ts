import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Besoin } from "../models/Besoin";

export default class BesoinController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Besoin.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Besoin.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Besoin non trouvé" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Besoin.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Besoin.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Besoin non trouvé" });
            await item.update({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Besoin.findOne({ where: { id: req.params.id } });
            if (item) {
                await item.destroy();
                return res.status(200).json({ success: true, message: "Besoin supprimé" });
            } else {
                return res.status(404).json({ success: false, message: "Besoin non trouvé" });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async approuver(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Besoin.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Besoin non trouvé" });
            await item.update({ statut: 'approuve', quantiteApprouvee: req.body.quantiteApprouvee });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async refuser(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Besoin.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Besoin non trouvé" });
            await item.update({ statut: 'refuse' });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByArticle(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Besoin.findAll({ where: { articleId: req.params.articleId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

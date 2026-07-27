import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Rebut } from "../models/Rebut";
import { Article } from "../models/Article";

export default class RebutController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Rebut.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Rebut.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByArticle(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Rebut.findAll({ where: { articleId: req.params.articleId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Rebut.create({ ...req.body });
            await Article.decrement('stockActuel', { by: item.quantite, where: { id: item.articleId } });
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
            const item = await Rebut.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });
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
            const item = await Rebut.findOne({ where: { id: req.params.id } });
            if (item) {
                await item.destroy();
                return res.status(200).json({ success: true, message: "Supprimé" });
            } else {
                return res.status(404).json({ success: false, message: "Non trouvé" });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

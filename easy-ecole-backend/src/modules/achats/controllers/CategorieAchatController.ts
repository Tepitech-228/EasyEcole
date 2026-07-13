import { Request, Response } from "express";
import { CategorieAchat } from "../models/CategorieAchat";

export default class CategorieAchatController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await CategorieAchat.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const existing = await CategorieAchat.findOne({ where: { nom: req.body.nom } });
            if (existing)
                return res.status(400).json({ success: false, alreadyExists: true });

            const item = await CategorieAchat.create({ ...req.body });
            return res.status(201).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await CategorieAchat.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Catégorie non trouvée" });

            await item.update({ ...req.body });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await CategorieAchat.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Catégorie non trouvée" });

            await item.destroy();
            return res.status(200).json({ success: true, message: "Catégorie supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

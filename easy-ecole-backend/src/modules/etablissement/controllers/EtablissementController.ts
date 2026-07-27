import { Request, Response } from "express";
import { Etablissement } from "../models/Etablissement";

export default class EtablissementController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { return res.status(200).send(await Etablissement.findAll()); }
        catch (error) { return res.status(500).json({ success: false, error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouve" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
    static async create(req: Request, res: Response): Promise<Response> {
        try { return res.status(201).send(await Etablissement.create(req.body)); }
        catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }
    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouve" });
            await item.update(req.body);
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }
    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouve" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprime" });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}

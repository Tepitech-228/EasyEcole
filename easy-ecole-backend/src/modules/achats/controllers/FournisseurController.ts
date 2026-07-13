import { Request, Response } from "express";
import { Fournisseur } from "../models/Fournisseur";

export default class FournisseurController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Fournisseur.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Fournisseur.findByPk(req.params.id);

            if (item == null)
                return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Fournisseur.create({ ...req.body });
            return res.status(201).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Fournisseur.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

            await item.update({ ...req.body });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Fournisseur.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

            await item.destroy();
            return res.status(200).json({ success: true, message: "Fournisseur supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

import { Request, Response } from "express";
import { RhPrestataire } from "../models/RhPrestataire";
import { RhIndemnitePrestataire } from "../models/RhIndemnitePrestataire";

export default class RhPrestataireController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPrestataire.findAll({ include: [{ association: RhPrestataire.associations.indemnites }] });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPrestataire.findByPk(req.params.id, { include: [{ association: RhPrestataire.associations.indemnites }] });
            if (!data) return res.status(404).json({ success: false, message: "Prestataire non trouvé" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPrestataire.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPrestataire.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Prestataire non trouvé" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPrestataire.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Prestataire non trouvé" });
            await data.destroy();
            return res.status(200).json({ success: true, message: "Prestataire supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

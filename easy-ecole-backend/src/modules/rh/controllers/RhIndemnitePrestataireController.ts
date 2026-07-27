import { Request, Response } from "express";
import { RhIndemnitePrestataire } from "../models/RhIndemnitePrestataire";
import { RhPrestataire } from "../models/RhPrestataire";

export default class RhIndemnitePrestataireController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.findAll({ include: [{ association: RhIndemnitePrestataire.associations.prestataire }] });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.findByPk(req.params.id, { include: [{ association: RhIndemnitePrestataire.associations.prestataire }] });
            if (!data) return res.status(404).json({ success: false, message: "Indemnité non trouvée" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getByPrestataire(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.findAll({
                where: { prestataireId: req.params.prestataireId },
                include: [{ association: RhIndemnitePrestataire.associations.prestataire }]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Indemnité non trouvée" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhIndemnitePrestataire.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Indemnité non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true, message: "Indemnité supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

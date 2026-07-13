import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { JuryMembre } from "../models/JuryMembre";

export default class JuryMembreController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            if (req.query.deliberationId) where.deliberationId = req.query.deliberationId;
            let data = await JuryMembre.findAll({
                where,
                include: [{ all: true }]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await JuryMembre.findByPk(req.params.id, { include: [{ all: true }] });
            if (!data) return res.status(404).json({ success: false, message: "Membre non trouvé" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await JuryMembre.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await JuryMembre.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Membre non trouvé" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

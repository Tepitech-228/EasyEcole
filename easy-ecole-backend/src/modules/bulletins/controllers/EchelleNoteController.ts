import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EchelleNote } from "../models/EchelleNote";

export default class EchelleNoteController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<EchelleNote>> = { order: [['ordre', 'ASC']] }
        try {
            let data = await EchelleNote.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
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
            const data = await EchelleNote.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

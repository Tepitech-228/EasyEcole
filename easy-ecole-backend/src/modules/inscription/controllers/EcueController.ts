import { Request, Response } from "express";
import { Ecue } from "../models/Ecue";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class EcueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findAll({
                include: [Ecue.associations.cours]
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findByPk(req.params.id, {
                include: [Ecue.associations.cours]
            });
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await Ecue.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await Ecue.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await Ecue.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getByUe(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findAll({
                where: { coursId: req.params.ueId },
                include: [Ecue.associations.cours]
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}

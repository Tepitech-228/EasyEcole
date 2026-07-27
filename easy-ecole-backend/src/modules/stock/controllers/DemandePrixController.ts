import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandePrix } from "../models/DemandePrix";

export default class DemandePrixController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandePrix.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await DemandePrix.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Demande de prix non trouvée" });
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
            const item = await DemandePrix.create({ ...req.body });
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
            const item = await DemandePrix.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Demande de prix non trouvée" });
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
            const item = await DemandePrix.findOne({ where: { id: req.params.id } });
            if (item) {
                await item.destroy();
                return res.status(200).json({ success: true, message: "Demande de prix supprimée" });
            } else {
                return res.status(404).json({ success: false, message: "Demande de prix non trouvée" });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async retenir(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await DemandePrix.findOne({ where: { id: req.params.id } });
            if (item == null) return res.status(404).json({ success: false, message: "Demande de prix non trouvée" });
            await item.update({ statut: 'retenu' });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByArticle(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandePrix.findAll({ where: { articleId: req.params.articleId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByFournisseur(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandePrix.findAll({ where: { fournisseurId: req.params.fournisseurId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

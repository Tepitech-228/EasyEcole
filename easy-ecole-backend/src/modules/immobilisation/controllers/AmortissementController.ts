import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Amortissement } from "../models/Amortissement";
import { Immobilisation } from "../models/Immobilisation";
import { AmortissementService } from "../services/AmortissementService";

export default class AmortissementController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { const items = await Amortissement.findAll(); return res.status(200).send(items); }
        catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Amortissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Amortissement.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            return res.status(500).json({ success: false, error: error });
        }
    }
    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Amortissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update(req.body);
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            return res.status(500).json({ success: false, error: error });
        }
    }
    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Amortissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprimé" });
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async generer(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const items = await AmortissementService.genererPourImmobilisation(Number(req.params.immobilisationId));
            return res.status(200).send(items);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    static async genererAll(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const immobilisations = await Immobilisation.findAll({ where: { categorieId: { [Op.ne]: null } } });
            const results: any[] = [];
            for (const immo of immobilisations) {
                try {
                    const items = await AmortissementService.genererPourImmobilisation(Number(immo.id));
                    results.push({ immobilisationId: immo.id, success: true, amortissements: items });
                } catch (e: any) {
                    results.push({ immobilisationId: immo.id, success: false, error: e.message });
                }
            }
            return res.status(200).send(results);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

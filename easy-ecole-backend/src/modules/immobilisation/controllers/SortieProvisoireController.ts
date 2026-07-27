import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SortieProvisoire } from "../models/SortieProvisoire";

export default class SortieProvisoireController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { const items = await SortieProvisoire.findAll(); return res.status(200).send(items); }
        catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await SortieProvisoire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await SortieProvisoire.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            return res.status(500).json({ success: false, error: error });
        }
    }
    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await SortieProvisoire.findByPk(req.params.id);
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
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await SortieProvisoire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprimé" });
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async getByImmobilisation(req: Request, res: Response): Promise<Response> {
        try {
            const items = await SortieProvisoire.findAll({ where: { immobilisationId: req.params.immobilisationId } });
            return res.status(200).send(items);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async retour(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await SortieProvisoire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update({ statut: 'retourne', dateRetourEffectif: new Date().toISOString().split('T')[0] });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
}

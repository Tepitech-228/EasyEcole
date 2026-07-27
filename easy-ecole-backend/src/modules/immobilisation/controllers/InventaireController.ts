import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Inventaire } from "../models/Inventaire";
import { LigneInventaire } from "../models/LigneInventaire";
import { Immobilisation } from "../models/Immobilisation";

export default class InventaireController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { const items = await Inventaire.findAll(); return res.status(200).send(items); }
        catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Inventaire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Inventaire.create({ ...req.body });
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
            const item = await Inventaire.findByPk(req.params.id);
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
            const item = await Inventaire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprimé" });
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async cloture(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Inventaire.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update({ statut: 'cloture', dateFin: new Date() as any });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async getWithLignes(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Inventaire.findByPk(req.params.id, {
                include: [{ model: LigneInventaire, as: 'lignes', include: [{ model: Immobilisation, as: 'immobilisation' }] }]
            });
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
}

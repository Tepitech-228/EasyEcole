import { Request, Response } from "express";
import { Etablissement } from "../models/Etablissement";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class EtablissementController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            const etablissementId = (req as any).etablissementId;

            // Admin voit tous les établissements
            if (role === RolesUtilisateur.ADMIN) {
                return res.status(200).send(await Etablissement.findAll());
            }

            // Non-admin ne voit que son établissement
            if (etablissementId) {
                const item = await Etablissement.findByPk(etablissementId);
                return res.status(200).send(item ? [item] : []);
            }

            return res.status(200).send([]);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouvé" });
            // Vérifier les droits
            const role = (req as any).utilisateurRole;
            const etablissementId = (req as any).etablissementId;
            if (role !== RolesUtilisateur.ADMIN && etablissementId && Number(item.id) !== Number(etablissementId)) {
                return res.status(403).json({ success: false, message: "Accès non autorisé" });
            }
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        // Seul l'admin peut créer un établissement
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }
        try {
            return res.status(201).send(await Etablissement.create(req.body));
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouvé" });
            
            // Vérifier les droits
            const role = (req as any).utilisateurRole;
            const etablissementId = (req as any).etablissementId;
            if (role !== RolesUtilisateur.ADMIN && etablissementId && Number(item.id) !== Number(etablissementId)) {
                return res.status(403).json({ success: false, message: "Accès non autorisé" });
            }

            await item.update(req.body);
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        // Seul l'admin peut supprimer un établissement
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }
        try {
            const item = await Etablissement.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Etablissement non trouvé" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprimé" });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}

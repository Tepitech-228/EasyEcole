import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeStage } from "../models/DemandeStage";
import { OffreStage } from "../models/OffreStage";
import { Apprenant } from "../../auth/models/Apprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class DemandeStageController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandeStage.findAll({
                include: [
                    { model: OffreStage, as: 'offreStage', attributes: ['id', 'titre'] },
                    { model: Apprenant, as: 'apprenant', include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }] }
                ]
            });
            return res.status(200).send(items);
        }
        catch (error) { return res.status(500).json({ success: false, error: error }); }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await DemandeStage.findByPk(req.params.id, {
                include: [
                    { model: OffreStage, as: 'offreStage', attributes: ['id', 'titre'] },
                    { model: Apprenant, as: 'apprenant', include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }] }
                ]
            });
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await DemandeStage.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async valider(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await DemandeStage.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update({ statut: 'valide' });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }

    static async rejeter(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await DemandeStage.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update({ statut: 'rejete', motifRejet: req.body.motifRejet });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
}

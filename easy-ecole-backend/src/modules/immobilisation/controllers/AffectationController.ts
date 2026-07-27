import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Affectation } from "../models/Affectation";
import { Site } from "../models/Site";
import { Departement } from "../models/Departement";
import { Localisation } from "../models/Localisation";

export default class AffectationController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { const items = await Affectation.findAll(); return res.status(200).send(items); }
        catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Affectation.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await Affectation.create({ ...req.body });
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
            const item = await Affectation.findByPk(req.params.id);
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
            const item = await Affectation.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprimé" });
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async getByImmobilisation(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Affectation.findAll({
                where: { immobilisationId: req.params.immobilisationId },
                include: [
                    { model: Site, as: 'site' },
                    { model: Departement, as: 'departement' },
                    { model: Localisation, as: 'localisation' }
                ]
            });
            return res.status(200).send(items);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
    static async getCurrent(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Affectation.findOne({
                where: { immobilisationId: req.params.immobilisationId, dateRetour: { [Op.is]: null as any } },
                include: [
                    { model: Site, as: 'site' },
                    { model: Departement, as: 'departement' },
                    { model: Localisation, as: 'localisation' }
                ],
                order: [['dateAffectation', 'DESC']]
            });
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error: error }); }
    }
}

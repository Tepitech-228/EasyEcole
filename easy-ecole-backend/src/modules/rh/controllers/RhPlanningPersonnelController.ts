import { Request, Response } from "express";
import { Op, literal, FindOptions, InferAttributes } from "sequelize";
import { RhPlanningPersonnel } from "../models/RhPlanningPersonnel";
import { RhEmploye } from "../models/RhEmploye";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class RhPlanningPersonnelController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            let where: any = {};
            if (role === RolesUtilisateur.APPRENANT || role === RolesUtilisateur.ENSEIGNANT) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }
            const employeId = req.query.employeId as string | undefined;
            if (employeId) where.employeId = employeId;
            const data = await RhPlanningPersonnel.findAll({
                where,
                include: [{ association: RhPlanningPersonnel.associations.employe, include: [{ association: RhEmploye.associations.poste }] }]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPlanningPersonnel.findOne({
                where: { id: req.params.id },
                include: [{ association: RhPlanningPersonnel.associations.employe, include: [{ association: RhEmploye.associations.poste }] }]
            });
            if (!data) return res.status(404).json({ success: false, message: "Planning non trouvé" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPlanningPersonnel.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPlanningPersonnel.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Planning non trouvé" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const data = await RhPlanningPersonnel.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Planning non trouvé" });
            await data.destroy();
            return res.status(200).json({ success: true, message: "Planning supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getPersonnelPlanning(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const employe = await RhEmploye.findOne({ where: { utilisateurId } });
            if (!employe) return res.json({ plannings: [] });

            const now = new Date();
            const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
            const today = dayNames[now.getDay()];

            const data = await RhPlanningPersonnel.findAll({
                where: {
                    employeId: employe.id,
                    jourSemaine: today as any,
                    dateDebut: { [Op.lte]: now },
                    dateFin: { [Op.gte]: now }
                },
                order: [['heureDebut', 'ASC']]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

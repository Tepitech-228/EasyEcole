import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { ModuleElearning } from "../models/ModuleElearning";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class CoursEnLigneController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const cours = await CoursEnLigne.findAll({ include: [CoursEnLigne.associations.modules] });
            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const cours = await CoursEnLigne.findOne({
                where: { id: req.params.id },
                include: [{
                    model: ModuleElearning,
                    as: 'modules',
                    include: [ModuleElearning.associations.supports]
                }, CoursEnLigne.associations.salons]
            });

            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const cours = await CoursEnLigne.create({
                titre: req.body.titre,
                description: req.body.description,
                statut: req.body.statut || 'actif'
            });
            return res.status(201).send(cours);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const cours = await CoursEnLigne.findByPk(req.params.id);
            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            await cours.update(req.body);
            return res.status(200).send(cours);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        try {
            const cours = await CoursEnLigne.findByPk(req.params.id);
            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            await cours.destroy();
            return res.status(200).json({ success: true, message: "Cours supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

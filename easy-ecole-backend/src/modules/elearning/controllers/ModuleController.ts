import { Request, Response } from "express";
import { ModuleElearning } from "../models/ModuleElearning";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class ModuleController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const modules = await ModuleElearning.findAll({
                where: { coursId: req.params.coursId },
                include: [ModuleElearning.associations.supports]
            });
            return res.status(200).send(modules);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const module = await ModuleElearning.findOne({
                where: { id: req.params.id },
                include: [ModuleElearning.associations.supports]
            });

            if (!module)
                return res.status(404).json({ success: false, message: "Module non trouvé" });

            return res.status(200).send(module);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const module = await ModuleElearning.create({
                coursId: req.body.coursId,
                titre: req.body.titre,
                description: req.body.description,
                ordre: req.body.ordre || 0
            });
            return res.status(201).send(module);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const module = await ModuleElearning.findByPk(req.params.id);
            if (!module)
                return res.status(404).json({ success: false, message: "Module non trouvé" });

            await module.update(req.body);
            return res.status(200).send(module);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        try {
            const module = await ModuleElearning.findByPk(req.params.id);
            if (!module)
                return res.status(404).json({ success: false, message: "Module non trouvé" });

            await module.destroy();
            return res.status(200).json({ success: true, message: "Module supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

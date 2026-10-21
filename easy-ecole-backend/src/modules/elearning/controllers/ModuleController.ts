import { Request, Response } from "express";
import { ModuleElearning } from "../models/ModuleElearning";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import ElearningAccessService from "../services/ElearningAccessService";
import { SelectionCours } from "../models/SelectionCours";

export default class ModuleController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            const role = String((req as any).utilisateurRole);
            const utilisateurId = Number((req as any).utilisateurId);
            if (req.query.coursId) {
                const coursId = Number(req.query.coursId);
                if (!await ElearningAccessService.canAccessCourse(utilisateurId, role, coursId)) {
                    return res.status(403).json({ success: false, message: "Accès au cours non autorisé." });
                }
                where.coursId = coursId;
            } else if (role === RolesUtilisateur.APPRENANT) {
                const selections = await SelectionCours.findAll({
                    where: { utilisateurId, statut: "acces_ouvert" },
                    attributes: ["coursId"],
                });
                where.coursId = selections.map(selection => Number(selection.coursId));
            } else if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                const managed = await ModuleElearning.findAll({
                    attributes: ["coursId"],
                });
                const courseIds = Array.from(new Set(managed.map(module => Number(module.coursId))));
                const accessibleCourseIds: number[] = [];
                for (const courseId of courseIds) {
                    if (await ElearningAccessService.canManageCourse(utilisateurId, role, courseId)) {
                        accessibleCourseIds.push(courseId);
                    }
                }
                where.coursId = accessibleCourseIds;
            }
            const modules = await ModuleElearning.findAll({
                where,
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
            if (!await ElearningAccessService.canAccessCourse(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(module.coursId)
            )) return res.status(403).json({ success: false, message: "Accès au cours non autorisé." });

            return res.status(200).send(module);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            if (!await ElearningAccessService.canManageCourse(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(req.body.coursId)
            )) return res.status(403).json({ success: false, message: "Gestion du cours non autorisée." });
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
        try {
            const module = await ModuleElearning.findByPk(req.params.id);
            if (!module)
                return res.status(404).json({ success: false, message: "Module non trouvé" });
            if (!await ElearningAccessService.canManageCourse(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(module.coursId)
            )) return res.status(403).json({ success: false, message: "Gestion du cours non autorisée." });

            const changes = {
                titre: req.body.titre,
                description: req.body.description,
                ordre: req.body.ordre,
                dateDisponible: req.body.dateDisponible,
            };
            await module.update(Object.fromEntries(
                Object.entries(changes).filter(([, value]) => value !== undefined)
            ));
            return res.status(200).send(module);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const module = await ModuleElearning.findByPk(req.params.id);
            if (!module)
                return res.status(404).json({ success: false, message: "Module non trouvé" });
            if (!await ElearningAccessService.canManageCourse(
                Number((req as any).utilisateurId),
                String((req as any).utilisateurRole),
                Number(module.coursId)
            )) return res.status(403).json({ success: false, message: "Gestion du cours non autorisée." });

            await module.destroy();
            return res.status(200).json({ success: true, message: "Module supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

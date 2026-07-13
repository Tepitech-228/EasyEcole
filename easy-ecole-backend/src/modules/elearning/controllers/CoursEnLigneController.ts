import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { ModuleElearning } from "../models/ModuleElearning";
import { Support } from "../models/Support";
import { Quiz } from "../models/Quiz";
import { ReponseQuiz } from "../models/ReponseQuiz";
import { ProgressionApprenant } from "../models/ProgressionApprenant";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class CoursEnLigneController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole;

            const cours = await CoursEnLigne.findAll({
                include: [{
                    model: ModuleElearning,
                    as: 'modules',
                    attributes: ['id']
                }],
                order: [['createdAt', 'DESC']]
            });

            if (role === RolesUtilisateur.APPRENANT) {
                const coursWithProgress = [];
                for (const c of cours) {
                    const supports = await Support.findAll({
                        include: [{
                            model: ModuleElearning, as: 'module',
                            where: { coursId: c.id },
                            attributes: []
                        }],
                        attributes: ['id']
                    });
                    const supportIds = supports.map(s => s.id);
                    const termines = await ProgressionApprenant.count({
                        where: { apprenantId: userId, supportId: supportIds, termine: true }
                    });
                    const json = c.toJSON();
                    (json as any).progression = {
                        total: supportIds.length,
                        termine: termines,
                        taux: supportIds.length > 0 ? Math.round((termines / supportIds.length) * 100) : 0
                    };
                    coursWithProgress.push(json);
                }
                return res.status(200).send(coursWithProgress);
            }

            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole;

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

            const json = cours.toJSON() as any;

            if (role === RolesUtilisateur.APPRENANT) {
                const supportIds: number[] = [];
                for (const m of json.modules || []) {
                    for (const s of m.supports || []) {
                        supportIds.push(s.id);
                    }
                }
                const progressions = await ProgressionApprenant.findAll({
                    where: { apprenantId: userId, supportId: supportIds }
                });
                const progMap: Record<string, any> = {};
                for (const p of progressions) {
                    progMap[p.supportId] = { termine: p.termine, tempsPasse: p.tempsPasse, dernierAcces: p.dernierAcces };
                }
                json.progressionApprenant = progMap;
                json.progressionTaux = supportIds.length > 0
                    ? Math.round((progressions.filter(p => p.termine).length / supportIds.length) * 100)
                    : 0;
            }

            const quizList = await Quiz.findAll({
                where: { coursId: req.params.id },
                include: [{ association: Quiz.associations.cours, attributes: ['titre'] }]
            });

            if (role === RolesUtilisateur.APPRENANT) {
                const quizWithStatus = [];
                for (const q of quizList) {
                    const reponse = await ReponseQuiz.findOne({
                        where: { quizId: q.id, apprenantId: userId }
                    });
                    const qj = q.toJSON();
                    (qj as any).reponse = reponse || null;
                    (qj as any).questions = undefined;
                    quizWithStatus.push(qj);
                }
                json.quiz = quizWithStatus;
            } else {
                json.quiz = quizList;
            }

            return res.status(200).send(json);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPlayer(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole;

            const cours = await CoursEnLigne.findOne({
                where: { id: req.params.id },
                include: [{
                    model: ModuleElearning,
                    as: 'modules',
                    include: [ModuleElearning.associations.supports]
                }]
            });

            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            const json = cours.toJSON() as any;

            if (role === RolesUtilisateur.APPRENANT) {
                const supportIds: number[] = [];
                for (const m of json.modules || []) {
                    for (const s of m.supports || []) {
                        supportIds.push(s.id);
                    }
                }
                const progressions = await ProgressionApprenant.findAll({
                    where: { apprenantId: userId, supportId: supportIds }
                });
                const progMap: Record<string, any> = {};
                for (const p of progressions) {
                    progMap[p.supportId] = { termine: p.termine, tempsPasse: p.tempsPasse, dernierAcces: p.dernierAcces };
                }
                json.progressionApprenant = progMap;
                json.progressionTaux = supportIds.length > 0
                    ? Math.round((progressions.filter(p => p.termine).length / supportIds.length) * 100)
                    : 0;
            }

            const quizList = await Quiz.findAll({
                where: { coursId: req.params.id },
                attributes: ['id', 'titre', 'description', 'tempsLimite', 'coursId']
            });

            if (role === RolesUtilisateur.APPRENANT) {
                const quizWithStatus = [];
                for (const q of quizList) {
                    const reponse = await ReponseQuiz.findOne({
                        where: { quizId: q.id, apprenantId: userId }
                    });
                    const qj = q.toJSON();
                    (qj as any).reponse = reponse ? { score: reponse.score, total: reponse.total } : null;
                    quizWithStatus.push(qj);
                }
                json.quiz = quizWithStatus;
            } else {
                json.quiz = quizList;
            }

            return res.status(200).send(json);
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

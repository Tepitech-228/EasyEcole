import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { ModuleElearning } from "../models/ModuleElearning";
import { Support } from "../models/Support";
import { Quiz } from "../models/Quiz";
import { ReponseQuiz } from "../models/ReponseQuiz";
import { ProgressionApprenant } from "../models/ProgressionApprenant";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { AnneeElearning } from "../models/AnneeElearning";
import { SelectionCours } from "../models/SelectionCours";
import { Cours } from "../../inscription/models/Cours";
import { Parcours } from "../../inscription/models/Parcours";
import ElearningFinanceService, { ElearningFinanceError } from "../services/ElearningFinanceService";

export default class CoursEnLigneController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const userId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole;
            const formatFilter = req.query.format as string | undefined;

            const whereClause: any = {};
            if (formatFilter && ['video', 'pdf', 'mixte'].includes(formatFilter)) {
                whereClause.format = formatFilter;
            }
            if (role === RolesUtilisateur.APPRENANT) {
                const year = await ElearningFinanceService.getActiveYear();
                whereClause.statut = "publie";
                whereClause.anneeAcademiqueId = year.id;
                const accessible = await SelectionCours.findAll({
                    where: { utilisateurId: Number(userId), anneeAcademiqueId: year.id, statut: "acces_ouvert" },
                    attributes: ["coursId"],
                });
                whereClause.id = { [Op.in]: accessible.map(selection => Number(selection.coursId)) };
            }

            const cours = await CoursEnLigne.findAll({
                where: whereClause,
                include: [{
                    model: ModuleElearning,
                    as: 'modules',
                    attributes: ['id']
                }, {
                    model: Utilisateur,
                    as: 'enseignant',
                    attributes: ['id', 'nom', 'prenoms']
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

    static async catalogue(req: Request, res: Response): Promise<Response> {
        try {
            const year = await ElearningFinanceService.getActiveYear();
            const cours = await CoursEnLigne.findAll({
                where: { statut: "publie", anneeAcademiqueId: year.id },
                include: [
                    { model: Utilisateur, as: "professeurResponsable", attributes: ["id", "nom", "prenoms"] },
                    {
                        model: Cours,
                        as: "ue",
                        attributes: ["id", "code", "intitule", "parcoursId", "classeId"],
                        include: [{ model: Parcours, as: "parcours", attributes: ["id", "titre", "niveauEtudeId"] }],
                    },
                ],
                order: [["titre", "ASC"]],
            });
            if ((req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
                return res.status(200).json(cours);
            }
            const selections = await SelectionCours.findAll({
                where: { utilisateurId: Number((req as any).utilisateurId), anneeAcademiqueId: year.id },
                attributes: ["coursId", "statut", "coutFige"],
            });
            const selectedByCourse = new Map(selections.map(item => [Number(item.coursId), item]));
            return res.status(200).json(cours.map(course => ({
                ...course.toJSON(),
                selection: selectedByCourse.get(Number(course.id)) || null,
            })));
        } catch (error) {
            if (error instanceof ElearningFinanceError) {
                return res.status(error.statusCode).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: "Catalogue e-learning indisponible." });
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
                }, CoursEnLigne.associations.salons, {
                    model: Utilisateur,
                    as: 'enseignant',
                    attributes: ['id', 'nom', 'prenoms']
                }]
            });

            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            const json = cours.toJSON() as any;

            if (role === RolesUtilisateur.APPRENANT) {
                if (!(await ElearningFinanceService.hasCourseAccess(Number(userId), Number(cours.id)))) {
                    return res.status(403).json({ success: false, message: "Choisissez ce cours avec un budget suffisant pour accéder à son contenu." });
                }
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
                }, {
                    model: Utilisateur,
                    as: 'enseignant',
                    attributes: ['id', 'nom', 'prenoms']
                }]
            });

            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            const json = cours.toJSON() as any;

            if (role === RolesUtilisateur.APPRENANT) {
                if (!(await ElearningFinanceService.hasCourseAccess(Number(userId), Number(cours.id)))) {
                    return res.status(403).json({ success: false, message: "Choisissez ce cours avec un budget suffisant pour accéder à son contenu." });
                }
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
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès refusé" })
        }

        try {
            const image = req.file ? req.file.filename : undefined;
            const titre = String(req.body.titre || "").trim();
            const code = String(req.body.code || "").trim();
            const nbCredits = Number(req.body.nbCredits);
            const yearId = Number(req.body.anneeAcademiqueId);
            if (!titre || !code || !Number.isInteger(nbCredits) || nbCredits <= 0 || !yearId) {
                return res.status(400).json({ success: false, message: "Le titre, le code, l'année académique et un nombre de crédits positif sont requis." });
            }
            const year = await AnneeElearning.findByPk(yearId);
            if (!year) return res.status(400).json({ success: false, message: "Année académique e-learning introuvable." });
            const duplicate = await CoursEnLigne.findOne({ where: { code, anneeAcademiqueId: year.id } });
            if (duplicate) return res.status(409).json({ success: false, message: "Un cours porte déjà ce code pour cette année." });
            const rate = await ElearningFinanceService.getCurrentRate(year.id);
            const cours = await CoursEnLigne.create({
                coursId: req.body.coursId ? String(req.body.coursId) : null,
                ueId: req.body.ueId ? Number(req.body.ueId) : null,
                niveauEtudeId: req.body.niveauEtudeId ? Number(req.body.niveauEtudeId) : null,
                anneeAcademiqueId: year.id,
                code,
                nbCredits,
                coutUnitaire: rate,
                coutTotal: nbCredits * rate,
                chargeSupportId: req.body.chargeSupportId ? Number(req.body.chargeSupportId) : null,
                professeurId: req.body.professeurId ? Number(req.body.professeurId) : null,
                titre,
                description: req.body.description,
                image,
                statut: "brouillon",
                enseignantId: req.body.professeurId ? Number(req.body.professeurId) : null,
                format: req.body.format || 'mixte'
            });
            await ElearningFinanceService.recordAudit(Number((req as any).utilisateurId), role, "cours.cree", "cours", Number(cours.id), { code, titre });
            return res.status(201).send(cours);
        } catch (error) {
            if (error instanceof ElearningFinanceError) {
                return res.status(error.statusCode).json({ success: false, message: error.message });
            }
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès refusé" })
        }

        try {
            const cours = await CoursEnLigne.findByPk(req.params.id);
            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });
            const updates: Record<string, unknown> = {};
            for (const field of ["titre", "description", "code", "format"]) {
                if (req.body[field] !== undefined) updates[field] = req.body[field];
            }
            if (req.body.coursId !== undefined) updates.coursId = req.body.coursId ? String(req.body.coursId) : null;
            for (const field of ["ueId", "niveauEtudeId", "anneeAcademiqueId", "chargeSupportId", "professeurId"]) {
                if (req.body[field] !== undefined) {
                    const value = req.body[field] === null || req.body[field] === "" ? null : Number(req.body[field]);
                    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
                        return res.status(400).json({ success: false, message: `Valeur invalide pour ${field}.` });
                    }
                    updates[field] = value;
                }
            }
            if (req.body.nbCredits !== undefined) {
                const credits = Number(req.body.nbCredits);
                if (!Number.isInteger(credits) || credits <= 0) {
                    return res.status(400).json({ success: false, message: "Le nombre de crédits doit être supérieur à zéro." });
                }
                updates.nbCredits = credits;
                updates.coutTotal = credits * Number(cours.coutUnitaire);
            }
            if (updates.anneeAcademiqueId !== undefined && updates.anneeAcademiqueId !== null) {
                const targetYearId = Number(updates.anneeAcademiqueId);
                const rate = await ElearningFinanceService.getCurrentRate(targetYearId);
                updates.coutUnitaire = rate;
                updates.coutTotal = Number(updates.nbCredits ?? cours.nbCredits) * rate;
            }
            const nextCode = String(updates.code ?? cours.code ?? "").trim();
            const nextYearId = Number(updates.anneeAcademiqueId ?? cours.anneeAcademiqueId);
            if (nextCode && nextYearId) {
                const duplicate = await CoursEnLigne.findOne({
                    where: { code: nextCode, anneeAcademiqueId: nextYearId, id: { [Op.ne]: cours.id } },
                });
                if (duplicate) return res.status(409).json({ success: false, message: "Un cours porte déjà ce code pour cette année." });
            }
            if (req.body.statut !== undefined) {
                if (!["brouillon", "publie", "desactive"].includes(req.body.statut)) {
                    return res.status(400).json({ success: false, message: "Statut de cours invalide." });
                }
                if (req.body.statut === "publie") {
                    const code = String(updates.code ?? cours.code ?? "").trim();
                    const titre = String(updates.titre ?? cours.titre ?? "").trim();
                    const credits = Number(updates.nbCredits ?? cours.nbCredits);
                    const yearId = Number(updates.anneeAcademiqueId ?? cours.anneeAcademiqueId);
                    const total = Number(updates.coutTotal ?? cours.coutTotal);
                    const professeur = Number(updates.professeurId ?? cours.professeurId ?? cours.enseignantId);
                    const chargeSupport = Number(updates.chargeSupportId ?? cours.chargeSupportId);
                    if (!code || !titre || !yearId || credits <= 0 || total <= 0 || !professeur || !chargeSupport) {
                        return res.status(400).json({ success: false, message: "Complétez le code, le titre, l'année, les crédits, le tarif, le professeur et le chargé de support avant publication." });
                    }
                    updates.datePublication = new Date();
                }
                updates.statut = req.body.statut;
            }
            if (req.file) updates.image = req.file.filename;
            await cours.update(updates);
            await ElearningFinanceService.recordAudit(Number((req as any).utilisateurId), role, "cours.modifie", "cours", Number(cours.id), updates);
            return res.status(200).send(cours);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès refusé" })
        }

        try {
            const cours = await CoursEnLigne.findByPk(req.params.id);
            if (!cours)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            const selections = await SelectionCours.count({ where: { coursId: Number(cours.id) } });
            if (selections > 0) {
                await cours.update({ statut: "desactive" });
                return res.status(200).json({ success: true, statut: "desactive", historiqueConserve: true });
            }
            await cours.destroy();
            return res.status(200).json({ success: true, statut: "supprime" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

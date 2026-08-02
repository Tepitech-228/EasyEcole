import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Cours } from "../models/Cours";
import { NiveauEtude } from "../models/NiveauEtude";
import { Parcours } from "../models/Parcours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CoursParticipant } from "../models/CoursParticipant";

export default class CoursController {

    constructor() { }

    static async getAllCours(req: Request, res: Response): Promise<Response> {
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;
        const orderBy = (req.query.orderBy as string) || 'createdAt';
        const orderDir = (req.query.orderDir as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const filters: any = {};
        if (req.query.parcoursId) filters.parcoursId = req.query.parcoursId as string;
        if (req.query.classeId) filters.classeId = req.query.classeId as string;
        if (req.query.semestre) filters.semestre = req.query.semestre as string;
        if (req.query.estObligatoire !== undefined) filters.estObligatoire = req.query.estObligatoire === 'true';
        if (req.query.enseignantId) filters.enseignantId = req.query.enseignantId as string;

        let options: any = {
            order: [[orderBy, orderDir]],
        }

        if (hasPagination) {
            options.offset = offset;
            options.limit = limit;
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = {
                ...options,
                include: [
                    Cours.associations.classe,
                    { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
                ],
                where: { ...filters }
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = {
                ...options,
                include: [
                    Cours.associations.classe,
                    { association: Cours.associations.enseignant, where: { utilisateurId: (req as any).utilisateurId } },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
                ],
                where: { ...filters }
            }
        }
        else {
            return res.status(403).json({ success: false })
        }

        try {
            if (hasPagination) {
                const { count, rows } = await Cours.findAndCountAll(options);
                return res.status(200).json({
                    data: rows,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        totalPages: Math.ceil(count / limit)
                    }
                });
            } else {
                const cours = await Cours.findAll(options);
                return res.status(200).send(cours);
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        options = { include: [Cours.associations.classe], where: { id: req.params.id } }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = {
                where: { id: req.params.id },
                include: [
                    Cours.associations.classe,
                    Cours.associations.chapitresCours,
                    Cours.associations.seances,
                    Cours.associations.enseignant,
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
                ],
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = {
                where: { id: req.params.id },
                include: [
                    Cours.associations.classe,
                    Cours.associations.chapitresCours,
                    Cours.associations.seances,
                    { association: Cours.associations.enseignant, where: { utilisateurId: (req as any).utilisateurId } },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
                ],
            }
        }
        else {
            return res.status(403).json({ success: false })
        }

        try {
            const cours: Cours | null = await Cours.findOne(options);

            if (cours == null)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCoursParticipants(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CoursParticipant>> = {}

        // Un enseignant ne peut voir les participants que de ses propres cours
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
            if (!enseignant) {
                return res.status(403).json({ success: false, message: "Enseignant non trouvé" });
            }
            options = {
                where: { coursId: req.params.id },
                include: [
                    { 
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
                        include: [Utilisateur.associations.apprenant],
                        required: true,
                    },
                    {
                        association: CoursParticipant.associations.cours,
                        where: { enseignantId: enseignant.id },
                        required: true
                    },
                    CoursParticipant.associations.cursusApprenant
                ]
            }
        } else {
            options = {
                where: { coursId: req.params.id },
                include: [
                    { 
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
                        include: [Utilisateur.associations.apprenant],
                        required: true,
                    },
                    CoursParticipant.associations.cours,
                    CoursParticipant.associations.cursusApprenant
                ]
            }
        }

        try {
            let coursParticipants: CoursParticipant[];
            coursParticipants = await CoursParticipant.findAll(options);

            return res.status(200).send(coursParticipants);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        if (!req.body.code) {
            const annee = new Date().getFullYear();
            const dernier = await Cours.findOne({
                order: [['id', 'DESC']],
                attributes: ['id']
            });
            const seq = (dernier?.id ?? 0) + 1;
            req.body.code = `UE-${annee}-${String(seq).padStart(3, '0')}`;
        }

        const existing = await Cours.findOne({ where: { code: req.body.code, parcoursId: req.body.parcoursId } });
        if (existing) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }

        const newCours = await Cours.create({
            code: req.body.code,
            intitule: req.body.intitule,
            credit: req.body.credit,
            creditEcts: req.body.creditEcts ?? req.body.credit,
            objectifs: req.body.objectifs ?? req.body.intitule,
            estObligatoire: req.body.estObligatoire ?? true,
            description: req.body.description,
            semestre: req.body.semestre,
            classeId: req.body.classeId,
            parcoursId: req.body.parcoursId,
            volumeHoraire: req.body.volumeHoraire,
            coefficient: req.body.coefficient,
        });

        return res.status(201).send(newCours);
    }

    static async updateCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {

            if (cours.code != req.body.code && await Cours.findOne({ where: { code: req.body.code, parcoursId: req.body.parcoursId } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }

            await cours.update({
                code: req.body.code,
                intitule: req.body.intitule,
                credit: req.body.credit,
                creditEcts: req.body.creditEcts,
                objectifs: req.body.objectifs,
                estObligatoire: req.body.estObligatoire,
                description: req.body.description,
                semestre: req.body.semestre,
                classeId: req.body.classeId,
                parcoursId: req.body.parcoursId,
                volumeHoraire: req.body.volumeHoraire,
                coefficient: req.body.coefficient,
            })
                .then(async (cours) => {
                    return res.status(200).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async assignerCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {
            await cours.update({
                enseignantId: req.body.enseignantId,
            })
                .then(async (cours) => {
                    return res.status(200).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async revoquerAssignationCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {
            await cours.update({
                enseignantId: null,
            })
                .then(async (cours) => {
                    return res.status(200).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async deleteCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cours: Cours | null = await Cours.findOne({ where: { id: req.params.id } });
        if (cours) {
            await cours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Cours supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async getMesPresences(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const coursList = await Cours.findAll({
                include: [{
                    association: Cours.associations.enseignant,
                    where: { utilisateurId: (req as any).utilisateurId },
                    required: true
                }, {
                    association: 'listesPresences' as any,
                    include: [{
                        association: 'presences' as any,
                        include: [{
                            association: 'presencesCoursParticipants' as any
                        }]
                    }]
                }, {
                    association: Cours.associations.classe
                }, {
                    association: Cours.associations.parcours,
                    include: [Parcours.associations.niveauEtude]
                }]
            })

            return res.status(200).send(coursList)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async getArbrePedagogique(req: Request, res: Response): Promise<Response> {
        try {
            const parcours = await Parcours.findAll({
                include: [
                    { association: Parcours.associations.niveauEtude },
                    { association: Parcours.associations.cours }
                ],
                order: [
                    [{ model: NiveauEtude, as: 'niveauEtude' }, 'libelle', 'ASC'],
                    ['titre', 'ASC']
                ]
            });

            const tree = parcours.map(p => {
                const coursList = (p as any).cours || [];
                const semestres: Record<string, any> = {};

                coursList.forEach((c: any) => {
                    const sem = c.semestre || 'non-defini';
                    if (!semestres[sem]) {
                        semestres[sem] = { semestre: sem, cours: [], totalCredits: 0, totalCours: 0 };
                    }
                    semestres[sem].cours.push({
                        id: c.id,
                        code: c.code,
                        intitule: c.intitule,
                        credit: c.credit,
                        creditEcts: c.creditEcts,
                        volumeHoraire: c.volumeHoraire,
                        coefficient: c.coefficient,
                        objectifs: c.objectifs,
                    });
                    semestres[sem].totalCredits += c.creditEcts || c.credit || 0;
                    semestres[sem].totalCours += 1;
                });

                return {
                    id: p.id,
                    titre: p.titre,
                    description: p.description,
                    type: p.type,
                    niveau: p.niveauEtude ? { id: p.niveauEtude.id, libelle: p.niveauEtude.libelle } : null,
                    semestres: Object.values(semestres)
                };
            });

            return res.status(200).send(tree);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Cours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Cours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { CursusApprenant } from "../models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeInscription } from "../models/DemandeInscription";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { CoursStatutService } from '../services/CoursStatutService';

export default class CursusApprenantController {

    constructor() { }

    static async getAllCursusApprenant(req: Request, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const offset = (page - 1) * limit;

            let where: any = {};
            let apprenantWhere: any = {};

            if ((req.query.anneeAcademiqueId as string)) {
                where.anneeAcademiqueId = req.query.anneeAcademiqueId;
            }
            if ((req.query.niveauEtudeId as string)) {
                where.niveauEtudeId = req.query.niveauEtudeId;
            }
            if ((req.query.parcoursId as string)) {
                where.parcoursId = req.query.parcoursId;
            }
            if ((req.query.classeId as string)) {
                where.classeId = req.query.classeId;
            }
            if ((req.query.search as string)) {
                apprenantWhere = {
                    [Op.or]: [
                        { nom: { [Op.substring]: req.query.search } },
                        { prenoms: { [Op.substring]: req.query.search } }
                    ]
                };
            }

            if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
                where.utilisateurId = (req as any).utilisateurId;
            }

            const include: any[] = [
                {
                    association: CursusApprenant.associations.utilisateur,
                    include: [
                        { association: Utilisateur.associations.apprenant },
                        { association: 'dossiersEtudiants' }
                    ],
                    where: Object.keys(apprenantWhere).length > 0 ? apprenantWhere : undefined,
                    required: Object.keys(apprenantWhere).length > 0
                },
                CursusApprenant.associations.parcours,
                CursusApprenant.associations.classe,
                CursusApprenant.associations.anneeAcademique,
                CursusApprenant.associations.niveauEtude,
                CursusApprenant.associations.etablissement
            ];

            const { count, rows } = await CursusApprenant.findAndCountAll({
                where,
                include,
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                distinct: true
            });

            const totalPages = Math.ceil(count / limit);

            return res.status(200).json({
                data: rows,
                pagination: { page, limit, total: count, totalPages }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCoursChoisisCursusApprenant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CursusApprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { utilisateurId: (req as any).utilisateurId },
                include: [
                    { 
                        association: CursusApprenant.associations.demandeInscription,
                        include: [{association: DemandeInscription.associations.cours, include: [
                            Cours.associations.enseignant,
                            Cours.associations.classe,
                            {association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude]}]}
                        ]
                    },
                    CursusApprenant.associations.parcours,
                    CursusApprenant.associations.classe,
                    CursusApprenant.associations.anneeAcademique,
                    CursusApprenant.associations.niveauEtude
                ],
                order: [['createdAt', 'DESC']],
                limit: 1 }
        }
        else {
            return res.status(403).json({ success: false })
        }

        try {
            let cursusApprenant: CursusApprenant | null;
            cursusApprenant = await CursusApprenant.findOne(options);

            return res.status(200).send(cursusApprenant);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCursusApprenant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CursusApprenant>> = {}
        options = { where: { id: req.params.id } }

        try {
            const cursusApprenant: CursusApprenant | null = await CursusApprenant.findOne(options);

            if (cursusApprenant == null)
                return res.status(404).json({ success: false, message: "CursusApprenant non trouvée" });

            return res.status(200).send(cursusApprenant);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCursusApprenant(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let cursusApprenant: CursusApprenant = new CursusApprenant();
        cursusApprenant.externe = req.body.externe
        cursusApprenant.etablissementId = req.body.etablissementId
        cursusApprenant.intituleParcours = req.body.intituleParcours
        cursusApprenant.parcoursId = req.body.parcoursId
        cursusApprenant.classeId = req.body.classeId
        cursusApprenant.anneeAcademiqueId = req.body.anneeAcademiqueId
        cursusApprenant.niveauEtudeId = req.body.niveauEtudeId
        cursusApprenant.demandeInscriptionId = req.body.demandeInscriptionId

        await cursusApprenant.save()
            .then((cursusApprenant) => {
                return res.status(201).send(cursusApprenant);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateCursusApprenant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CursusApprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cursusApprenant: CursusApprenant | null = await CursusApprenant.findOne(options);
        if (cursusApprenant != null) {

            await cursusApprenant.update({
                externe: req.body.externe,
                etablissementId: req.body.etablissementId,
                intituleParcours: req.body.intituleParcours,
                parcoursId: req.body.parcoursId,
                classeId: req.body.classeId,
                anneeAcademiqueId: req.body.anneeAcademiqueId,
                niveauEtudeId: req.body.niveauEtudeId,
                demandeInscriptionId: req.body.demandeInscriptionId,
            })
                .then(async (cursusApprenant) => {
                    return res.status(200).send(cursusApprenant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "CursusApprenant non trouvée" });
        }

        return null
    }

    static async deleteCursusApprenant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CursusApprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cursusApprenant: CursusApprenant | null = await CursusApprenant.findOne({ where: { id: req.params.id } });
        if (cursusApprenant) {
            await cursusApprenant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "CursusApprenant supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "CursusApprenant non trouvée" });
        }

        return null
    }

    static async getStatutsCours(req: Request, res: Response): Promise<Response> {
      try {
        const utilisateurId = (req as any).utilisateurId;

        const cursus = await CursusApprenant.findOne({
          where: { utilisateurId },
          order: [['createdAt', 'DESC']]
        });

        if (!cursus) {
          return res.status(404).json({ success: false, message: "Aucun cursus trouvé" });
        }

        const resultats = await CoursStatutService.getStatutsCours(cursus.id);
        return res.status(200).send(resultats);
      } catch (error) {
        return res.status(500).json({ success: false, error });
      }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<CursusApprenant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await CursusApprenant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
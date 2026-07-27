import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeOrientation } from "../models/DemandeOrientation";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Parcours } from "../models/Parcours";
import { PrerequisParcoursChoisi } from "../models/PrerequisParcoursChoisi";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Apprenant } from "../../auth/models/Apprenant";
import { ReponseOrientation } from "../models/ReponseOrientation";

export default class DemandeOrientationController {

    constructor() { }

    static async getAllDemandesOrientation(req: Request, res: Response): Promise<Response> {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        const { anneeAcademiqueId, niveauEtudeId, parcoursId, statut, search } = req.query;

        let where: any = {};
        let parcoursChoisiWhere: any = {};
        let parcoursInclude: any = null;

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.utilisateurId = (req as any).utilisateurId;
        }

        if (anneeAcademiqueId) {
            where.anneeAcademiqueId = anneeAcademiqueId;
        }

        if (parcoursId) {
            parcoursChoisiWhere.parcoursId = parcoursId;
        }

        if (niveauEtudeId) {
            parcoursInclude = {
                model: Parcours,
                as: 'parcours',
                where: { niveauEtudeId }
            };
        }

        if (statut === 'termine') {
            where['$reponseOrientation.id$'] = { [Op.ne]: null };
        } else if (statut === 'en_cours') {
            where['$reponseOrientation.id$'] = null;
        }

        if (search) {
            where['$utilisateur.nom$'] = { [Op.like]: `%${search}%` };
        }

        let includeOptions: any[] = [
            { association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
            { association: DemandeOrientation.associations.reponseOrientation, required: false },
            DemandeOrientation.associations.anneeAcademique
        ];

        const hasParcoursFilter = parcoursId || niveauEtudeId;
        const parcoursChoisiInclude: any = { association: DemandeOrientation.associations.parcoursChoisis };

        if (hasParcoursFilter) {
            parcoursChoisiInclude.where = parcoursChoisiWhere;
            parcoursChoisiInclude.required = true;
        }

        if (parcoursInclude) {
            parcoursChoisiInclude.include = [parcoursInclude];
        }

        includeOptions.push(parcoursChoisiInclude);

        try {
            const { count, rows } = await DemandeOrientation.findAndCountAll({
                where,
                include: includeOptions,
                order: [['dateDemande', 'DESC']],
                limit,
                offset,
                distinct: true
            });

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeOrientation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { id: req.params.id, utilisateurId: (req as any).utilisateurId },
                include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, { model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                    { model: Parcours, as: 'parcours', include: [Parcours.associations.categorie, Parcours.associations.niveauEtude, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] },
                    { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }
                ] }]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = {
                where: { id: req.params.id },
                include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, { model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                    { model: Parcours, as: 'parcours', include: [Parcours.associations.categorie, Parcours.associations.niveauEtude, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] },
                    { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }
                ] }]
            }
        }

        try {
            const demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne(options);

            if (demandeOrientation == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demandeOrientation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDemandeOrientation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demandeOrientation: DemandeOrientation = new DemandeOrientation();
        demandeOrientation.dateDemande = req.body.dateDemande
        demandeOrientation.utilisateurId = (req as any).utilisateurId

        await demandeOrientation.save()
            .then(async (demandeOrientation) => {
                EmailSender.getInstance().sendConfirmationDemandeOrientation((req as any).utilisateurIdentifiant, (req as any).utilisateurEmail)
                    // .then(async () => {
                    //     return res.status(201).send({success: true});
                    // })
                    // .catch((error) => {
                    //     return res.status(400).json({ success: false, error: error });
                    // });
                return res.status(201).send(demandeOrientation);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    // static async updateDemandeOrientation(req: Request, res: Response): Promise<Response | null> {
    //     let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
    //     if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
    //         return res.status(403).json({success: false})
    //     }
    //     else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
    //         options = { where: {id: req.params.id} }
    //     }

    //     let demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne(options);
    //     if(demandeOrientation != null) {            
    //         await demandeOrientation.update({
    //             libelle: req.body.name,
    //         })
    //             .then(async (demandeOrientation) => {
    //                 return res.status(200).send(demandeOrientation);
    //             })
    //             .catch((error) => {
    //                 return res.status(400).json({ success: false, error: error });
    //             });
    //     }
    //     else {
    //         return res.status(404).json({ success: false, message: "Demande non trouvée" });
    //     }

    //     return null
    // }

    static async deleteDemandeOrientation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne({ where: { id: req.params.id } });
        if (demandeOrientation) {
            await demandeOrientation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DemandeOrientation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeOrientation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
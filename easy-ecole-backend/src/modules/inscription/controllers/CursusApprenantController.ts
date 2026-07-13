import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { CursusApprenant } from "../models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeInscription } from "../models/DemandeInscription";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";

export default class CursusApprenantController {

    constructor() { }

    static async getAllCursusApprenant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CursusApprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, include: [{ association: CursusApprenant.associations.utilisateur, include: [Utilisateur.associations.apprenant] }, CursusApprenant.associations.parcours, CursusApprenant.associations.classe, CursusApprenant.associations.anneeAcademique, CursusApprenant.associations.niveauEtude], order: [['createdAt', 'DESC']] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { include: [{ association: CursusApprenant.associations.utilisateur, include: [Utilisateur.associations.apprenant] }, CursusApprenant.associations.parcours, CursusApprenant.associations.classe, CursusApprenant.associations.anneeAcademique, CursusApprenant.associations.niveauEtude], order: [['createdAt', 'DESC']] }
        }

        try {
            let cursusApprenant: CursusApprenant[];
            cursusApprenant = await CursusApprenant.findAll(options);

            return res.status(200).send(cursusApprenant);
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
        cursusApprenant.etablissement = req.body.etablissement
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
                etablissement: req.body.etablissement,
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
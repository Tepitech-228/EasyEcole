import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Parcours } from "../models/Parcours";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { Cours } from "../models/Cours";

export default class ParcoursController {

    constructor() { }

    static async getAllParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {
            include: [Parcours.associations.niveauEtude]
        }

        try {
            let parcours: Parcours[];
            parcours = await Parcours.findAll(options);

            return res.status(200).send(parcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        options = { where: { id: req.params.id }, include: [Parcours.associations.niveauEtude, {association: Parcours.associations.cours, include: [Cours.associations.classe]}, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }

        try {
            const parcours: Parcours | null = await Parcours.findOne(options);

            if (parcours == null)
                return res.status(404).json({ success: false, message: "Parcours non trouvé" });

            return res.status(200).send(parcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createParcours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { titre: req.body.titre } });

        if (parcours != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let parcours: Parcours = new Parcours();
            parcours.titre = req.body.titre
            parcours.description = req.body.description
            parcours.niveauEtudeId = req.body.niveauEtudeId

            await parcours.save()
                .then((parcours) => {
                    return res.status(201).send(parcours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        return null
    }

    static async updateParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne(options);
        if (parcours != null) {

            if (await Parcours.findOne({ where: { titre: req.body.titre } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await parcours.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    niveauEtudeId: req.body.niveauEtudeId,
                })
                    .then(async (parcours) => {
                        return res.status(200).send(parcours);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    static async deleteParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { id: req.params.id } });
        if (parcours) {
            await parcours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Parcours supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Parcours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Parcours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
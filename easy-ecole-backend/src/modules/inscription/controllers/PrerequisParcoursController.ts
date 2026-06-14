import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PrerequisParcours } from "../models/PrerequisParcours";

export default class PrerequisParcoursController {

    constructor() { }

    static async getAllPrerequisParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PrerequisParcours>> = {}

        try {
            let prerequisParcours: PrerequisParcours[];
            prerequisParcours = await PrerequisParcours.findAll(options);

            return res.status(200).send(prerequisParcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPrerequisParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PrerequisParcours>> = {}
        options = { where: { id: req.params.id } }

        try {
            const prerequisParcours: PrerequisParcours | null = await PrerequisParcours.findOne(options);

            if (prerequisParcours == null)
                return res.status(404).json({ success: false, message: "Prerequis non trouvé" });

            return res.status(200).send(prerequisParcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createPrerequisParcours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let prerequisParcours: PrerequisParcours = new PrerequisParcours();
        prerequisParcours.noteRequise = req.body.noteRequise
        prerequisParcours.typeEvaluation = req.body.typeEvaluation
        prerequisParcours.periodeEvaluation = req.body.periodeEvaluation
        prerequisParcours.parcoursId = req.body.parcoursId
        prerequisParcours.niveauEtudeId = req.body.niveauEtudeId
        prerequisParcours.matierePrerequisId = req.body.matierePrerequisId

        await prerequisParcours.save()
            .then((prerequisParcours) => {
                return res.status(201).send(prerequisParcours);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updatePrerequisParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PrerequisParcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let prerequisParcours: PrerequisParcours | null = await PrerequisParcours.findOne(options);
        if (prerequisParcours != null) {

            await prerequisParcours.update({
                noteRequise: req.body.noteRequise,
                typeEvaluation: req.body.typeEvaluation,
                periodeEvaluation: req.body.periodeEvaluation,
            })
                .then(async (prerequisParcours) => {
                    return res.status(200).send(prerequisParcours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Prerequis non trouvé" });
        }

        return null
    }

    static async deletePrerequisParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PrerequisParcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let prerequisParcours: PrerequisParcours | null = await PrerequisParcours.findOne({ where: { id: req.params.id } });
        if (prerequisParcours) {
            await prerequisParcours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Prerequis supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Prerequis non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<PrerequisParcours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await PrerequisParcours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
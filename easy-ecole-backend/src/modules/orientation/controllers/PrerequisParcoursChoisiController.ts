import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PrerequisParcoursChoisi } from "../models/PrerequisParcoursChoisi";

export default class PrerequisParcoursChoisiController {

    constructor() { }

    static async getAllPrerequisParcoursChoisi(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PrerequisParcoursChoisi>> = {}

        try {
            let prerequisParcoursChoisi: PrerequisParcoursChoisi[];
            prerequisParcoursChoisi = await PrerequisParcoursChoisi.findAll();

            return res.status(200).send(prerequisParcoursChoisi);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPrerequisParcoursChoisi(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PrerequisParcoursChoisi>> = {}
        options = { where: { id: req.params.id } }

        try {
            const prerequisParcoursChoisi: PrerequisParcoursChoisi | null = await PrerequisParcoursChoisi.findOne(options);

            if (prerequisParcoursChoisi == null)
                return res.status(404).json({ success: false, message: "Prerequis non trouvé" });

            return res.status(200).send(prerequisParcoursChoisi);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createPrerequisParcoursChoisi(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let prerequisParcoursChoisi: PrerequisParcoursChoisi = new PrerequisParcoursChoisi();
        prerequisParcoursChoisi.note = req.body.note

        await prerequisParcoursChoisi.save()
            .then((prerequisParcoursChoisi) => {
                return res.status(201).send(prerequisParcoursChoisi);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updatePrerequisParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PrerequisParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let prerequisParcoursChoisi: PrerequisParcoursChoisi | null = await PrerequisParcoursChoisi.findOne(options);
        if (prerequisParcoursChoisi != null) {

            await prerequisParcoursChoisi.update({
                note: req.body.note,
            })
                .then(async (prerequisParcoursChoisi) => {
                    return res.status(200).send(prerequisParcoursChoisi);
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

    static async deletePrerequisParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PrerequisParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let prerequisParcoursChoisi: PrerequisParcoursChoisi | null = await PrerequisParcoursChoisi.findOne({ where: { id: req.params.id } });
        if (prerequisParcoursChoisi) {
            await prerequisParcoursChoisi.destroy()
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
        let options: CountOptions<InferAttributes<PrerequisParcoursChoisi>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await PrerequisParcoursChoisi.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
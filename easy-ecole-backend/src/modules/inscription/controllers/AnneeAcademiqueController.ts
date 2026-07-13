import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { AnneeAcademique } from "../models/AnneeAcademique";

export default class AnneeAcademiqueController {

    constructor() { }

    static async getAllAnneesAcademiques(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<AnneeAcademique>> = {
            order: [
                ['libelle', 'DESC']
            ]
        }

        try {
            let anneesAcademiques: AnneeAcademique[];
            anneesAcademiques = await AnneeAcademique.findAll(options);

            return res.status(200).send(anneesAcademiques);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getAnneeAcademique(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<AnneeAcademique>> = {}
        options = { where: { id: req.params.id } }

        try {
            const anneeAcademique: AnneeAcademique | null = await AnneeAcademique.findOne(options);

            if (anneeAcademique == null)
                return res.status(404).json({ success: false, message: "AnneeAcademique non trouvée" });

            return res.status(200).send(anneeAcademique);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createAnneeAcademique(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let anneeAcademique: AnneeAcademique | null = await AnneeAcademique.findOne({ where: { libelle: req.body.libelle } });

        if (anneeAcademique != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let anneeAcademique: AnneeAcademique = new AnneeAcademique();
            anneeAcademique.libelle = req.body.libelle
            anneeAcademique.description = req.body.description

            await anneeAcademique.save()
                .then((anneeAcademique) => {
                    return res.status(201).send(anneeAcademique);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateAnneeAcademique(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<AnneeAcademique>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let anneeAcademique: AnneeAcademique | null = await AnneeAcademique.findOne(options);
        if (anneeAcademique != null) {

            await anneeAcademique.update({
                libelle: req.body.libelle,
                description: req.body.description,
            })
                .then(async (anneeAcademique) => {
                    return res.status(200).send(anneeAcademique);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "AnneeAcademique non trouvée" });
        }

        return null
    }

    static async deleteAnneeAcademique(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<AnneeAcademique>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let anneeAcademique: AnneeAcademique | null = await AnneeAcademique.findOne({ where: { id: req.params.id } });
        if (anneeAcademique) {
            await anneeAcademique.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "AnneeAcademique supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "AnneeAcademique non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<AnneeAcademique>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await AnneeAcademique.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
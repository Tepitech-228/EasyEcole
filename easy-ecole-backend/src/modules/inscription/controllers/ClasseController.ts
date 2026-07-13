import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Classe } from "../models/Classe";

export default class ClasseController {

    constructor() { }

    static async getAllClasses(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Classe>> = {}
        if(req.query.niveauEtudeId) {
            options = {
                where: {niveauEtudeId: req.query.niveauEtudeId as string}
            }
        }

        try {
            let classes: Classe[];
            classes = await Classe.findAll(options);

            return res.status(200).send(classes);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getClasse(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Classe>> = {}
        options = { where: { id: req.params.id } }

        try {
            const classe: Classe | null = await Classe.findOne(options);

            if (classe == null)
                return res.status(404).json({ success: false, message: "Classe non trouvée" });

            return res.status(200).send(classe);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createClasse(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let classe: Classe | null = await Classe.findOne({ where: { libelle: req.body.libelle } });

        if (classe != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let classe: Classe = new Classe();
            classe.libelle = req.body.libelle
            classe.description = req.body.description
            classe.niveauEtudeId = req.body.niveauEtudeId

            await classe.save()
                .then((classe) => {
                    return res.status(201).send(classe);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Classe>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let classe: Classe | null = await Classe.findOne(options);
        if (classe != null) {

            await classe.update({
                libelle: req.body.libelle,
                description: req.body.description,
                niveauEtudeId: req.body.niveauEtudeId,
            })
                .then(async (classe) => {
                    return res.status(200).send(classe);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Classe non trouvée" });
        }

        return null
    }

    static async deleteClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Classe>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let classe: Classe | null = await Classe.findOne({ where: { id: req.params.id } });
        if (classe) {
            await classe.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Classe supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Classe non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Classe>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Classe.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
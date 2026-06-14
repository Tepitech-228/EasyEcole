import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SalleDeClasse } from "../models/SalleDeClasse";

export default class SalleDeClasseController {

    constructor() { }

    static async getAllSallesDeClasse(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        if(req.query.classeId) {
            options = {
                where: {classeId: req.query.classeId as string}
            }
        }

        try {
            let sallesDeClasse: SalleDeClasse[];
            sallesDeClasse = await SalleDeClasse.findAll(options);

            return res.status(200).send(sallesDeClasse);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSalleDeClasse(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        options = { where: { id: req.params.id } }

        try {
            const salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne(options);

            if (salledeclasse == null)
                return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });

            return res.status(200).send(salledeclasse);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createSalleDeClasse(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne({ where: { libelle: req.body.libelle } });

        if (salledeclasse != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let salledeclasse: SalleDeClasse = new SalleDeClasse();
            salledeclasse.libelle = req.body.libelle
            salledeclasse.description = req.body.description
            salledeclasse.classeId = req.body.classeId

            await salledeclasse.save()
                .then((salledeclasse) => {
                    return res.status(201).send(salledeclasse);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateSalleDeClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne(options);
        if (salledeclasse != null) {

            await salledeclasse.update({
                libelle: req.body.libelle,
                description: req.body.description,
                classeId: req.body.classeId,
            })
                .then(async (salledeclasse) => {
                    return res.status(200).send(salledeclasse);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });
        }

        return null
    }

    static async deleteSalleDeClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne({ where: { id: req.params.id } });
        if (salledeclasse) {
            await salledeclasse.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "SalleDeClasse supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<SalleDeClasse>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await SalleDeClasse.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
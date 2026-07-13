import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypeNoteEvaluation } from "../models/TypeNoteEvaluation";

export default class TypeNoteEvaluationController {

    constructor() { }

    static async getAllTypesNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<TypeNoteEvaluation>> = {}

        try {
            let typesNoteEvaluation: TypeNoteEvaluation[];
            typesNoteEvaluation = await TypeNoteEvaluation.findAll(options);

            return res.status(200).send(typesNoteEvaluation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getTypeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<TypeNoteEvaluation>> = {}
        options = { where: { id: req.params.id } }

        try {
            const typeNoteEvaluation: TypeNoteEvaluation | null = await TypeNoteEvaluation.findOne(options);

            if (typeNoteEvaluation == null)
                return res.status(404).json({ success: false, message: "TypeNoteEvaluation non trouvé" });

            return res.status(200).send(typeNoteEvaluation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createTypeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let typeNoteEvaluation: TypeNoteEvaluation | null = await TypeNoteEvaluation.findOne({ where: { libelle: req.body.libelle } });

        if (typeNoteEvaluation != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let typeNoteEvaluation: TypeNoteEvaluation = new TypeNoteEvaluation();
            typeNoteEvaluation.libelle = req.body.libelle
            typeNoteEvaluation.description = req.body.description
            typeNoteEvaluation.poids = req.body.poids

            await typeNoteEvaluation.save()
                .then((typeNoteEvaluation) => {
                    return res.status(201).send(typeNoteEvaluation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateTypeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<TypeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let typeNoteEvaluation: TypeNoteEvaluation | null = await TypeNoteEvaluation.findOne(options);
        if (typeNoteEvaluation != null) {
            let verificationTypeNoteEvaluatino: TypeNoteEvaluation | null = await TypeNoteEvaluation.findOne({ where: { libelle: req.body.libelle } })
            if (verificationTypeNoteEvaluatino != null && verificationTypeNoteEvaluatino.libelle != req.body.libelle) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {
                await typeNoteEvaluation.update({
                    libelle: req.body.libelle,
                    description: req.body.description,
                    poids: req.body.poids,
                })
                    .then(async (typeNoteEvaluation) => {
                        return res.status(200).send(typeNoteEvaluation);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "TypeNoteEvaluation non trouvé" });
        }

        return null
    }

    static async deleteTypeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<TypeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let typeNoteEvaluation: TypeNoteEvaluation | null = await TypeNoteEvaluation.findOne({ where: { id: req.params.id } });
        if (typeNoteEvaluation) {
            await typeNoteEvaluation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "TypeNoteEvaluation supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "TypeNoteEvaluation non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<TypeNoteEvaluation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await TypeNoteEvaluation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
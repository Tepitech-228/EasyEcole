import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { FraisInscription } from "../models/FraisInscription";

export default class FraisInscriptionController {

    constructor() { }

    static async getAllFraisInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<FraisInscription>> = {}

        try {
            let fraisInscription: FraisInscription[];
            fraisInscription = await FraisInscription.findAll(options);

            return res.status(200).send(fraisInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getFraisInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<FraisInscription>> = {}
        options = { where: { id: req.params.id } }

        try {
            const fraisInscription: FraisInscription | null = await FraisInscription.findOne(options);

            if (fraisInscription == null)
                return res.status(404).json({ success: false, message: "Frais non trouvée" });

            return res.status(200).send(fraisInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }


    static async createFraisInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FraisInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { titre: req.body.titre, sessionId: req.body.sessionId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let fraisInscription: FraisInscription | null = await FraisInscription.findOne(options);
        if (fraisInscription == null) {
            let fraisInscription: FraisInscription = new FraisInscription();
            fraisInscription.titre = req.body.titre
            fraisInscription.description = req.body.description
            fraisInscription.montant = req.body.montant
            fraisInscription.fraisDesCours = req.body.fraisDesCours
            fraisInscription.sessionId = req.body.sessionId

            await fraisInscription.save()
                .then(async (fraisInscription) => {
                    return res.status(201).send(fraisInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadyExists: true });
        }

        return null
    }

    static async updateFraisInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FraisInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let fraisInscription: FraisInscription | null = await FraisInscription.findOne(options);
        if (fraisInscription != null) {

            if (fraisInscription.titre != req.body.titre && await FraisInscription.findOne({ where: { titre: req.body.titre, sessionId: req.body.sessionId } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await fraisInscription.update({
                    titre: req.body.titre,
                    montant: req.body.montant,
                    fraisDesCours: req.body.fraisDesCours,
                    description: req.body.description,
                })
                    .then(async (fraisInscription) => {
                        return res.status(200).send(fraisInscription);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Frais d'inscription non trouvé" });
        }

        return null
    }

    static async deleteFraisInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FraisInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let fraisInscription: FraisInscription | null = await FraisInscription.findOne({ where: { id: req.params.id } });
        if (fraisInscription) {
            await fraisInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Frais supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Frais non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<FraisInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await FraisInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
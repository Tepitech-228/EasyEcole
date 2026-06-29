import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { EtatsValidationParcours } from "../../../core/enums/EtatsValidationParcours";

export default class ParcoursChoisiController {

    constructor() { }

    static async getAllParcoursChoisis(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ParcoursChoisi>> = {}

        try {
            let parcoursChoisis: ParcoursChoisi[];
            parcoursChoisis = await ParcoursChoisi.findAll(options);

            return res.status(200).send(parcoursChoisis);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getParcoursChoisi(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ParcoursChoisi>> = {}
        options = { where: { id: req.params.id } }

        try {
            const parcoursChoisi: ParcoursChoisi | null = await ParcoursChoisi.findOne(options);

            if (parcoursChoisi == null)
                return res.status(404).json({ success: false, message: "Parcours choisi non trouvé" });

            return res.status(200).send(parcoursChoisi);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createParcoursChoisi(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            // Allow admin to create parcours choices for learners
        }
        else if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await ParcoursChoisi.create({
            etatDeValidation: EtatsValidationParcours.ENCOURS,
            messageDeValidation: req.body.messageDeValidation,
            parcoursId: req.body.parcoursId,
            demandeInscriptionId: req.body.demandeInscriptionId,
            prerequisParcoursChoisis: req.body.prerequisParcoursChoisis,
        },
            { include: [ParcoursChoisi.associations.prerequisParcoursChoisis] }
        )
            .then((parcoursChoisi) => {
                return res.status(201).send(parcoursChoisi);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ParcoursChoisi>> = {}
        options = { where: { id: req.params.id } }

        let parcoursChoisi: ParcoursChoisi | null = await ParcoursChoisi.findOne(options);
        if (parcoursChoisi != null) {
            await parcoursChoisi.update({
                etatDeValidation: req.body.etatDeValidation,
                messageDeValidation: req.body.messageDeValidation,
                choixFinal: req.body.choixFinal,
                // parcoursId: req.body.parcoursId,
                // demandeInscriptionId: req.body.demandeInscriptionId,
            })
                .then(async (parcoursChoisi) => {
                    return res.status(200).send(parcoursChoisi);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours choisi non trouvé" });
        }

        return null
    }

    static async deleteParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { id: req.params.id } }
        }

        let parcoursChoisi: ParcoursChoisi | null = await ParcoursChoisi.findOne({ where: { id: req.params.id } });
        if (parcoursChoisi) {
            await parcoursChoisi.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Parcours choisi supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours choisi non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ParcoursChoisi>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await ParcoursChoisi.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
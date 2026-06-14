import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ReponseInscription } from "../models/ReponseInscription";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { DemandeInscription } from "../models/DemandeInscription";

export default class ReponseInscriptionController {

    constructor() { }

    static async getAllReponsesInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ReponseInscription>> = {}

        try {
            let reponsesInscription: ReponseInscription[];
            reponsesInscription = await ReponseInscription.findAll(options);

            return res.status(200).send(reponsesInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getReponseInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ReponseInscription>> = {}
        options = { where: { id: req.params.id } }

        try {
            const reponseInscription: ReponseInscription | null = await ReponseInscription.findOne(options);

            if (reponseInscription == null)
                return res.status(404).json({ success: false, message: "Réponse non trouvée" });

            return res.status(200).send(reponseInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createReponseInscription(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let reponseInscription: ReponseInscription = new ReponseInscription();
        reponseInscription.message = req.body.message
        reponseInscription.dateReponse = req.body.dateReponse
        reponseInscription.demandeInscriptionId = req.body.demandeInscriptionId
        reponseInscription.utilisateurId = (req as any).utilisateurId

        await reponseInscription.save()
            .then(async (reponseInscription) => {
                let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne({ where: { id: reponseInscription.demandeInscriptionId }, include: [DemandeInscription.associations.utilisateur] })

                if (demandeInscription && demandeInscription.utilisateur) {
                    EmailSender.getInstance().sendReponseInscription(demandeInscription.utilisateur.identifiant, demandeInscription.utilisateur.email, reponseInscription.message)
                }

                return res.status(201).send(reponseInscription);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateReponseInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ReponseInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let reponseInscription: ReponseInscription | null = await ReponseInscription.findOne(options);
        if (reponseInscription != null) {
            await reponseInscription.update({
                message: req.body.message,
                dateReponse: req.body.dateReponse,
                demandeInscriptionId: req.body.demandeInscriptionId,
                utilisateurId: req.body.utilisateurId,
            })
                .then(async (reponseInscription) => {
                    return res.status(200).send(reponseInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Réponse non trouvée" });
        }

        return null
    }

    static async deleteReponseInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ReponseInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let reponseInscription: ReponseInscription | null = await ReponseInscription.findOne({ where: { id: req.params.id } });
        if (reponseInscription) {
            await reponseInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Réponse supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Réponse non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ReponseInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await ReponseInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
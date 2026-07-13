import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ReponseOrientation } from "../models/ReponseOrientation";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { DemandeOrientation } from "../models/DemandeOrientation";

export default class ReponseOrientationController {

    constructor() { }

    static async getAllReponsesOrientation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ReponseOrientation>> = {}

        try {
            let reponsesOrientation: ReponseOrientation[];
            reponsesOrientation = await ReponseOrientation.findAll();

            return res.status(200).send(reponsesOrientation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getReponseOrientation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ReponseOrientation>> = {}
        options = { where: { id: req.params.id } }

        try {
            const reponseOrientation: ReponseOrientation | null = await ReponseOrientation.findOne(options);

            if (reponseOrientation == null)
                return res.status(404).json({ success: false, message: "Réponse non trouvée" });

            return res.status(200).send(reponseOrientation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createReponseOrientation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let reponseOrientation: ReponseOrientation = new ReponseOrientation();
        reponseOrientation.message = req.body.message
        reponseOrientation.dateReponse = req.body.dateReponse
        reponseOrientation.demandeOrientationId = req.body.demandeOrientationId
        reponseOrientation.utilisateurId = (req as any).utilisateurId

        await reponseOrientation.save()
            .then(async (reponseOrientation) => {
                let demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne({ where: { id: reponseOrientation.demandeOrientationId }, include: [DemandeOrientation.associations.utilisateur] })

                if (demandeOrientation && demandeOrientation.utilisateur) {
                    EmailSender.getInstance().sendReponseOrientation(demandeOrientation.utilisateur.identifiant, demandeOrientation.utilisateur.email, reponseOrientation.message)
                }

                return res.status(201).send(reponseOrientation);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateReponseOrientation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ReponseOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let reponseOrientation: ReponseOrientation | null = await ReponseOrientation.findOne(options);
        if (reponseOrientation != null) {
            await reponseOrientation.update({
                message: req.body.message,
                dateReponse: req.body.dateReponse,
                demandeOrientationId: req.body.demandeOrientationId,
                utilisateurId: req.body.utilisateurId,
            })
                .then(async (reponseOrientation) => {
                    return res.status(200).send(reponseOrientation);
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

    static async deleteReponseOrientation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ReponseOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let reponseOrientation: ReponseOrientation | null = await ReponseOrientation.findOne({ where: { id: req.params.id } });
        if (reponseOrientation) {
            await reponseOrientation.destroy()
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

    static async autoriserInscription(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let reponseOrientation: ReponseOrientation | null = await ReponseOrientation.findOne({
            where: { id: req.params.id },
            include: [{ association: ReponseOrientation.associations.demandeOrientation, include: [DemandeOrientation.associations.utilisateur] }]
        });

        if (reponseOrientation == null) {
            return res.status(404).json({ success: false, message: "Réponse non trouvée" });
        }

        await reponseOrientation.update({
            statutAutorisation: req.body.statutAutorisation || 'autorise',
            dateAutorisationProvisoire: new Date()
        })
            .then(async (reponseOrientation) => {
                let demandeOrientation = reponseOrientation.demandeOrientation
                if (demandeOrientation && demandeOrientation.utilisateur) {
                    if (reponseOrientation.statutAutorisation == 'autorise') {
                        EmailSender.getInstance().sendReponseOrientation(
                            demandeOrientation.utilisateur.identifiant,
                            demandeOrientation.utilisateur.email,
                            'Félicitations ! Votre demande d\'inscription a été autorisée provisoirement. Veuillez finaliser votre inscription.'
                        )
                    } else {
                        EmailSender.getInstance().sendReponseOrientation(
                            demandeOrientation.utilisateur.identifiant,
                            demandeOrientation.utilisateur.email,
                            'Votre demande d\'autorisation d\'inscription a été refusée.'
                        )
                    }
                }

                return res.status(200).send(reponseOrientation);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ReponseOrientation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await ReponseOrientation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
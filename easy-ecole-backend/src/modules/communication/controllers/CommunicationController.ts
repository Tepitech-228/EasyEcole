import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Communication } from "../models/Communication";

export default class CommunicationController {

    constructor() { }

    static async getAllCommunications(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Communication>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { statut: 'publiee' } }
        }

        try {
            let communications: Communication[];
            communications = await Communication.findAll(options);

            return res.status(200).send(communications);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCommunication(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Communication>> = {}
        options = { where: { id: req.params.id } }

        try {
            const communication: Communication | null = await Communication.findOne(options);

            if (communication == null)
                return res.status(404).json({ success: false, message: "Communication non trouvée" });

            return res.status(200).send(communication);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCommunication(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let communication: Communication = new Communication();
        communication.titre = req.body.titre
        communication.contenu = req.body.contenu
        communication.statut = req.body.statut || 'brouillon'

        await communication.save()
            .then(async (communication) => {
                return res.status(201).send(communication);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateCommunication(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let communication: Communication | null = await Communication.findOne({ where: { id: req.params.id } });
        if (communication != null) {
            await communication.update({
                titre: req.body.titre,
                contenu: req.body.contenu,
                statut: req.body.statut
            })
                .then(async (communication) => {
                    return res.status(200).send(communication);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Communication non trouvée" });
        }

        return null
    }

    static async deleteCommunication(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let communication: Communication | null = await Communication.findOne({ where: { id: req.params.id } });
        if (communication) {
            await communication.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Communication supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Communication non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Communication.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}

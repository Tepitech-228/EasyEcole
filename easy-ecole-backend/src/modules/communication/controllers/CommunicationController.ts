import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Communication } from "../models/Communication";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class CommunicationController {

    constructor() { }

    static async getAllCommunications(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Communication>> = {
            include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }],
            order: [['datePublication', 'DESC']]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = {
                statut: 'publiee',
                cible: { [Op.in]: ['tous', 'apprenants'] }
            }
        } else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options.where = {
                statut: 'publiee',
                cible: { [Op.in]: ['tous', 'enseignants'] }
            }
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
        let options: FindOptions<InferAttributes<Communication>> = {
            where: { id: req.params.id },
            include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }]
        }

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
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let communication: Communication = new Communication();
        communication.titre = req.body.titre
        communication.contenu = req.body.contenu
        communication.statut = req.body.statut || 'publiee'
        communication.cible = req.body.cible || 'tous'
        communication.utilisateurId = (req as any).utilisateurId

        await communication.save()
            .then(async (communication) => {
                const created = await Communication.findByPk(communication.id, {
                    include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }]
                })
                return res.status(201).send(created);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateCommunication(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let communication: Communication | null = await Communication.findOne({ where: { id: req.params.id } });
        if (communication != null) {
            await communication.update({
                titre: req.body.titre,
                contenu: req.body.contenu,
                statut: req.body.statut,
                cible: req.body.cible
            })
                .then(async (communication) => {
                    const updated = await Communication.findByPk(communication.id, {
                        include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }]
                    })
                    return res.status(200).send(updated);
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
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
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

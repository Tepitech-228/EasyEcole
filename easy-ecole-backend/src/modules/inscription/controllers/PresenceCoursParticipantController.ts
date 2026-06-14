import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { Enseignant } from "../../auth/models/Enseignant";

export default class PresenceCoursParticipantController {

    constructor() { }

    static async getAllPresencesCoursParticipants(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {
            include: [PresenceCoursParticipant.associations.presence, PresenceCoursParticipant.associations.coursParticipant]
        }

        try {
            let presencesCoursParticipants: PresenceCoursParticipant[];
            presencesCoursParticipants = await PresenceCoursParticipant.findAll(options);

            return res.status(200).send(presencesCoursParticipants);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPresenceCoursParticipant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {}
        options = { where: { presenceId: req.params.id, coursParticipantId: req.body.coursParticipantId }, include: [PresenceCoursParticipant.associations.presence, PresenceCoursParticipant.associations.coursParticipant] }

        try {
            const presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);

            if (presenceCoursParticipant == null)
                return res.status(404).json({ success: false, message: "PresenceCoursParticipant non trouvée" });

            return res.status(200).send(presenceCoursParticipant);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createPresenceCoursParticipant(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let presenceCoursParticipant: PresenceCoursParticipant = new PresenceCoursParticipant();
        presenceCoursParticipant.presenceId = req.body.presenceId
        presenceCoursParticipant.coursParticipantId = req.body.coursParticipantId
        presenceCoursParticipant.etatDePresence = req.body.etatDePresence

        await presenceCoursParticipant.save()
            .then((presenceCoursParticipant) => {
                return res.status(201).send(presenceCoursParticipant);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updatePresenceCoursParticipant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { presenceId: req.params.id, coursParticipantId: req.body.coursParticipantId } }
        }

        let presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);
        if (presenceCoursParticipant != null) {

            await presenceCoursParticipant.update({
                presenceId: req.body.presenceId,
                coursParticipantId: req.body.coursParticipantId,
                etatDePresence: req.body.etatDePresence
            })
                .then(async (presenceCoursParticipant) => {
                    return res.status(200).send(presenceCoursParticipant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "PresenceCoursParticipant non trouvée" });
        }

        return null
    }

    static async deletePresenceCoursParticipant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { presenceId: req.params.id, coursParticipantId: req.body.coursParticipantId } }
        }

        let presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);
        if (presenceCoursParticipant) {
            await presenceCoursParticipant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "PresenceCoursParticipant supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "PresenceCoursParticipant non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<PresenceCoursParticipant>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await PresenceCoursParticipant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
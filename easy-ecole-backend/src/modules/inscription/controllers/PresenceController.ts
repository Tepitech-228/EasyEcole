import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Presence } from "../models/Presence";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";

export default class PresenceController {

    constructor() { }

    static async getAllPresences(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Presence>> = {
            include: [
                Presence.associations.presencesCoursParticipants
            ]
        }

        try {
            let presences: Presence[];
            presences = await Presence.findAll(options);

            return res.status(200).send(presences);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPresence(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        options = {
            where: { id: req.params.id }, include: [Presence.associations.presencesCoursParticipants]
        }

        try {
            const presence: Presence | null = await Presence.findOne(options);

            if (presence == null)
                return res.status(404).json({ success: false, message: "Presence non trouvée" });

            return res.status(200).send(presence);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createPresence(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let presence: Presence | null = await Presence.findOne({ where: { date: req.body.date, heureDebut: req.body.heureDebut, heureFin: req.body.heureFin, } });

        if (presence != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let presence: Presence = new Presence();
            presence.date = req.body.date
            presence.heureDebut = req.body.heureDebut
            presence.heureFin = req.body.heureFin
            presence.listePresenceId = req.body.listePresenceId

            await presence.save()
                .then((presence) => {
                    return res.status(201).send(presence);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updatePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let presence: Presence | null = await Presence.findOne(options);
        if (presence != null) {
            // if (presence.titre != req.body.titre && await Presence.findOne({ where: { titre: req.body.titre } }) != null) {
            //     return res.status(400).json({ success: false, alreadyExists: true });
            // }
            // else {
            await presence.update({
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                listePresenceId: req.body.listePresenceId,
            })
                .then(async (presence) => {
                    return res.status(200).send(presence);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
            // }
        }
        else {
            return res.status(404).json({ success: false, message: "Presence non trouvée" });
        }

        return null
    }

    static async deletePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let presence: Presence | null = await Presence.findOne({ where: { id: req.params.id } });
        if (presence) {
            await presence.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Presence supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Presence non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Presence>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Presence.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
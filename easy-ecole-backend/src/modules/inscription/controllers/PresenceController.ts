import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Presence } from "../models/Presence";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListePresence } from "../models/ListePresence";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import * as fs from "fs"
import * as path from "path"

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

    static async scanPresence(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        const { presenceId, userId } = req.body
        if (!presenceId || !userId) {
            return res.status(400).json({ success: false, message: "presenceId et userId requis" })
        }

        try {
            const presence = await Presence.findByPk(presenceId, {
                include: [{
                    association: Presence.associations.listePresence,
                    include: [ListePresence.associations.cours]
                }]
            })

            if (!presence || !presence.listePresence || !presence.listePresence.cours) {
                return res.status(404).json({ success: false, message: "Présence ou cours non trouvé" })
            }

            const coursId = presence.listePresence.cours.id

            const coursParticipant = await CoursParticipant.findOne({
                where: {
                    utilisateurId: userId,
                    coursId: coursId
                }
            })

            if (!coursParticipant) {
                return res.status(404).json({ success: false, message: "Participant non inscrit à ce cours" })
            }

            const existing = await PresenceCoursParticipant.findOne({
                where: {
                    presenceId: presenceId,
                    coursParticipantId: coursParticipant.id
                }
            })

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Présence déjà marquée pour cet étudiant" })
            }

            const presenceCoursParticipant = new PresenceCoursParticipant()
            presenceCoursParticipant.presenceId = presenceId
            presenceCoursParticipant.coursParticipantId = coursParticipant.id

            await presenceCoursParticipant.save()

            return res.status(201).json({ success: true, data: presenceCoursParticipant })
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async signPresence(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false, message: "Seul un enseignant peut signer" })
        }

        const { signature } = req.body
        if (!signature) {
            return res.status(400).json({ success: false, message: "Signature requise" })
        }

        try {
            const presence = await Presence.findByPk(req.params.id, {
                include: [{
                    association: Presence.associations.listePresence,
                    include: [{
                        association: ListePresence.associations.cours,
                        include: [Cours.associations.enseignant]
                    }]
                }]
            })

            if (!presence) {
                return res.status(404).json({ success: false, message: "Présence non trouvée" })
            }

            const enseignant = presence.listePresence?.cours?.enseignant as any
            if (!enseignant || enseignant.utilisateurId != (req as any).utilisateurId) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" })
            }

            if (presence.signature) {
                return res.status(400).json({ success: false, message: "Cette présence est déjà signée" })
            }

            const base64Data = signature.replace(/^data:image\/png;base64,/, "")
            const dir = "public/inscription/presences/signatures/"
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            const fileName = `${req.params.id}.png`
            const filePath = path.join(dir, fileName)
            fs.writeFileSync(filePath, base64Data, "base64")

            presence.signature = fileName
            presence.signedAt = new Date()
            await presence.save()

            return res.status(200).send(presence)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }
}
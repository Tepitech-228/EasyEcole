import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { Presence } from "../models/Presence";
import { ListePresence } from "../models/ListePresence";
import { CoursParticipant } from "../models/CoursParticipant";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import CahierCohorteService from "../services/CahierCohorteService";

export default class PresenceCoursParticipantController {

    constructor() { }

    private static async surveillantCanManagePresence(
        req: Request,
        presenceId: number | string,
        coursParticipantId: number | string
    ): Promise<boolean> {
        const etablissementId = await getSurveillantSiteId(req);
        if (!etablissementId) return false;

        const [presence, coursParticipant] = await Promise.all([
            Presence.findByPk(presenceId),
            CoursParticipant.findByPk(coursParticipantId),
        ]);
        if (!presence || !coursParticipant) return false;

        const listePresence = await ListePresence.findByPk(presence.listePresenceId);
        if (!listePresence) return false;

        const coursIds = await CahierCohorteService.trouverCoursIdsPourCahier(listePresence);
        if (!coursIds.includes(Number(coursParticipant.coursId))) return false;

        const cours = await Cours.findOne({
            where: { id: coursParticipant.coursId, etablissementId },
            attributes: ["id"],
        });
        return Boolean(cours);
    }

    private static async enseignantCanManagePresence(
        req: Request,
        presenceId: number | string,
        coursParticipantId: number | string,
    ): Promise<boolean> {
        if (!presenceId || !coursParticipantId) return false;

        const [enseignant, presence, coursParticipant] = await Promise.all([
            Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            }),
            Presence.findByPk(presenceId),
            CoursParticipant.findByPk(coursParticipantId),
        ]);
        if (!enseignant || !presence || !coursParticipant ||
            Number(presence.auteurEnseignantId) !== Number(enseignant.id)) {
            return false;
        }

        const listePresence = await ListePresence.findByPk(presence.listePresenceId);
        if (!listePresence ||
            !await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence)) {
            return false;
        }

        const coursIds = await CahierCohorteService.trouverCoursIdsPourCahier(listePresence);
        return coursIds.includes(Number(coursParticipant.coursId));
    }

    static async getAllPresencesCoursParticipants(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const utilisateurId = (req as any).utilisateurId;
        const where: any = {};

        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {
            include: [PresenceCoursParticipant.associations.presence, PresenceCoursParticipant.associations.coursParticipant]
        }

        // Un étudiant ne voit que ses propres présences
        if (role === RolesUtilisateur.APPRENANT) {
            const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['id'] });
            where.coursParticipantId = { [require('sequelize').Op.in]: coursParticipants.map(cp => cp.id) };
            options.where = where;
        }
        // Un enseignant ne voit que les présences de SES cours
        else if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
            if (enseignant) {
                const cours = await Cours.findAll({
                    where: { enseignantId: enseignant.id },
                    attributes: ["id"],
                });
                const cohortes = await CahierCohorteService.trouverCohortes(undefined, Number(enseignant.id));
                const listes = await ListePresence.findAll({
                    where: {
                        [Op.or]: [
                            { enseignantId: enseignant.id },
                            { coursId: { [Op.in]: cours.map(item => item.id) } },
                            ...CahierCohorteService.conditionsPourCohortes(cohortes),
                        ],
                    },
                    attributes: ["id"],
                });
                const presences = await Presence.findAll({
                    where: {
                        auteurEnseignantId: enseignant.id,
                        listePresenceId: { [Op.in]: listes.map(item => item.id) },
                    },
                    attributes: ["id"],
                });
                options.where = { presenceId: { [Op.in]: presences.map(item => item.id) } };
            }
            else options.where = { presenceId: { [Op.in]: [] } };
        } else if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            if (!etablissementId) {
                return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
            }
            const cours = await Cours.findAll({ where: { etablissementId }, attributes: ["id"] });
            const listes = await ListePresence.findAll({
                where: {
                    [Op.or]: [
                        { etablissementId },
                        { coursId: { [Op.in]: cours.map(item => item.id) } },
                    ],
                },
                attributes: ["id"],
            });
            const presences = await Presence.findAll({
                where: { listePresenceId: { [Op.in]: listes.map(item => item.id) } },
                attributes: ["id"],
            });
            options.where = { presenceId: { [Op.in]: presences.map(item => item.id) } };
        }

        try {
            let presencesCoursParticipants: PresenceCoursParticipant[];
            presencesCoursParticipants = await PresenceCoursParticipant.findAll(options);

            return res.status(200).send(presencesCoursParticipants);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getPresenceCoursParticipant(req: Request, res: Response): Promise<Response> {
        const coursParticipantId = (req.body as any)?.coursParticipantId ?? (req.query as any)?.coursParticipantId
        if (!coursParticipantId) {
            return res.status(400).json({ success: false, message: "coursParticipantId requis (body ou query)" });
        }
        let options: FindOptions<InferAttributes<PresenceCoursParticipant>> = {}
        options = { where: { presenceId: req.params.id, coursParticipantId }, include: [PresenceCoursParticipant.associations.presence, PresenceCoursParticipant.associations.coursParticipant] }

        try {
            const presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);

            if (presenceCoursParticipant == null)
                return res.status(404).json({ success: false, message: "PresenceCoursParticipant non trouvée" });

            const role = (req as any).utilisateurRole;
            const utilisateurId = (req as any).utilisateurId;

            // Un étudiant ne voit que ses propres présences
            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipant = (presenceCoursParticipant as any).coursParticipant;
                if (!coursParticipant || coursParticipant.utilisateurId !== utilisateurId) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            }
            // Un enseignant ne voit que les présences de SES cours
            else if (role === RolesUtilisateur.ENSEIGNANT) {
                const presence = (presenceCoursParticipant as any).presence;
                const coursParticipant = (presenceCoursParticipant as any).coursParticipant;
                if (!presence || !coursParticipant ||
                    !await PresenceCoursParticipantController.enseignantCanManagePresence(
                        req,
                        presence.id,
                        coursParticipant.id,
                    )) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const presence = (presenceCoursParticipant as any).presence;
                const coursParticipant = (presenceCoursParticipant as any).coursParticipant;
                if (!presence || !coursParticipant ||
                    !await PresenceCoursParticipantController.surveillantCanManagePresence(
                        req,
                        presence.id,
                        coursParticipant.id
                    )) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            }

            return res.status(200).send(presenceCoursParticipant);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createPresenceCoursParticipant(req: Request, res: Response): Promise<Response | null> {

        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ENSEIGNANT && role !== RolesUtilisateur.SURVEILLANT) {
            return res.status(403).json({ success: false })
        }

        if (role === RolesUtilisateur.SURVEILLANT &&
            !await PresenceCoursParticipantController.surveillantCanManagePresence(
                req,
                req.body.presenceId,
                req.body.coursParticipantId
            )) {
            return res.status(403).json({ success: false, message: "Cette présence n'appartient pas à votre site" });
        }
        if (role === RolesUtilisateur.ENSEIGNANT &&
            !await PresenceCoursParticipantController.enseignantCanManagePresence(
                req,
                req.body.presenceId,
                req.body.coursParticipantId,
            )) {
            return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à renseigner cette présence" });
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
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ENSEIGNANT && role !== RolesUtilisateur.SURVEILLANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { presenceId: req.params.id, coursParticipantId: req.body.coursParticipantId } }
        }

        if (role === RolesUtilisateur.SURVEILLANT &&
            !await PresenceCoursParticipantController.surveillantCanManagePresence(
                req,
                req.params.id,
                req.body.coursParticipantId
            )) {
            return res.status(403).json({ success: false, message: "Cette présence n'appartient pas à votre site" });
        }
        if (role === RolesUtilisateur.ENSEIGNANT &&
            !await PresenceCoursParticipantController.enseignantCanManagePresence(
                req,
                req.params.id,
                req.body.coursParticipantId,
            )) {
            return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à modifier cette présence" });
        }

        let presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);
        if (presenceCoursParticipant != null) {

            await presenceCoursParticipant.update({
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
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { presenceId: req.params.id, coursParticipantId: req.body.coursParticipantId } }
        }

        if (role === RolesUtilisateur.ENSEIGNANT &&
            !await PresenceCoursParticipantController.enseignantCanManagePresence(
                req,
                req.params.id,
                req.body.coursParticipantId,
            )) {
            return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à supprimer cette présence" });
        }

        let presenceCoursParticipant: PresenceCoursParticipant | null = await PresenceCoursParticipant.findOne(options);
        if (presenceCoursParticipant) {
            await presenceCoursParticipant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "PresenceCoursParticipant supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
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
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}
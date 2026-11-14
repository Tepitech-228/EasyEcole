import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";
import { CoursParticipant } from "../models/CoursParticipant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import CahierCohorteService from "../services/CahierCohorteService";

export default class ListePresenceController {

    constructor() { }

    static async getAllListesPresences(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const utilisateurId = (req as any).utilisateurId;
        let enseignantId: number | null = null;
        const where: any = {};

        try {
            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
                where.coursId = { [Op.in]: coursParticipants.map(cp => cp.coursId) };
            } else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
                if (!enseignant) return res.status(200).send([]);
                const cohortes = await CahierCohorteService.trouverCohortes(undefined, Number(enseignant.id));
                where[Op.or] = [
                    { enseignantId: enseignant.id },
                    ...CahierCohorteService.conditionsPourCohortes(cohortes),
                ];
            }

            if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                if (!etablissementId) {
                    return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
                }
                const coursDuSite = await Cours.findAll({
                    where: { etablissementId },
                    attributes: ["id"],
                });
                where[Op.or] = [
                    { etablissementId },
                    { coursId: { [Op.in]: coursDuSite.map(cours => cours.id) } },
                ];
            }

            const options: FindOptions<InferAttributes<ListePresence>> = {
                where,
                include: [
                    {
                        association: ListePresence.associations.cours,
                        include: [
                            Cours.associations.classe,
                            { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
                        ],
                    },
                    { association: ListePresence.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                    { association: ListePresence.associations.parcours, include: [Parcours.associations.niveauEtude] },
                    ListePresence.associations.niveauEtude,
                    ListePresence.associations.etablissement,
                ],
            };
            const listesPresences = await ListePresence.findAll(options);

            return res.status(200).send(listesPresences);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getListePresence(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListePresence>> = {}
        options = {
            where: { id: req.params.id }, include: [
                {
                    association: ListePresence.associations.cours,
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: ListePresence.associations.presences, include: [Presence.associations.presencesCoursParticipants] },
                { association: ListePresence.associations.parcours, include: [Parcours.associations.niveauEtude] },
                ListePresence.associations.niveauEtude,
                ListePresence.associations.etablissement,
            ]
        }

        try {
            const listePresence: ListePresence | null = await ListePresence.findOne(options);

            if (listePresence == null)
                return res.status(404).json({ success: false, message: "ListePresence non trouvée" });

            const role = (req as any).utilisateurRole;
            const utilisateurId = (req as any).utilisateurId;
            let enseignantId: number | null = null;

            // Un étudiant ne voit que les listes de présence de SES cours
            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
                const coursIds = coursParticipants.map(cp => cp.coursId);
                if (!listePresence.coursId || !coursIds.includes(listePresence.coursId)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette liste de présence" });
                }
            }
            else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
                enseignantId = enseignant ? Number(enseignant.id) : null;
                const autorise = enseignant &&
                    await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence);
                if (!autorise) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette liste de présence" });
                }
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                const siteDuCahier = Number(listePresence.etablissementId || (listePresence as any).cours?.etablissementId);
                if (!etablissementId || siteDuCahier !== etablissementId) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette liste de présence" });
                }
            }

            let coursParticipants: CoursParticipant[] | undefined;
            if (listePresence.parcoursId && listePresence.niveauEtudeId && listePresence.etablissementId) {
                const coursIds = await CahierCohorteService.trouverCoursIds({
                    parcoursId: Number(listePresence.parcoursId),
                    niveauEtudeId: Number(listePresence.niveauEtudeId),
                    etablissementId: Number(listePresence.etablissementId),
                });
                const participants = await CoursParticipant.findAll({
                    where: { coursId: { [Op.in]: coursIds } },
                    include: [
                        {
                            association: CoursParticipant.associations.utilisateur,
                            attributes: ["nom", "prenoms", "identifiant", "email", "contact", "photoDeProfil"],
                            include: [Utilisateur.associations.apprenant],
                        },
                        CoursParticipant.associations.cursusApprenant,
                    ],
                    order: [["id", "ASC"]],
                });
                const uniques = new Map<number, CoursParticipant>();
                for (const participant of participants) {
                    if (participant.utilisateurId && !uniques.has(Number(participant.utilisateurId))) {
                        uniques.set(Number(participant.utilisateurId), participant);
                    }
                }
                coursParticipants = [...uniques.values()];
            }

            const listePresenceData = typeof (listePresence as any).toJSON === "function"
                ? (listePresence as any).toJSON()
                : listePresence;
            if (role === RolesUtilisateur.ENSEIGNANT && enseignantId !== null && Array.isArray(listePresenceData.presences)) {
                listePresenceData.presences = listePresenceData.presences.filter(
                    (presence: Presence) => Number(presence.auteurEnseignantId) === enseignantId,
                );
            }
            return res.status(200).send({
                ...listePresenceData,
                ...(coursParticipants ? { coursParticipants } : {}),
            });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createListePresence(req: Request, res: Response): Promise<Response | null> {

        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.SURVEILLANT) {
            return res.status(403).json({ success: false })
        }

        let enseignantId = req.body.enseignantId;
        if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            const cours = etablissementId
                ? await Cours.findOne({
                    where: { id: req.body.coursId, etablissementId },
                    attributes: ["id", "enseignantId"],
                })
                : null;
            if (!cours) {
                return res.status(403).json({ success: false, message: "Ce cours n'appartient pas à votre site" });
            }
            enseignantId = cours.enseignantId;
        }

        let listePresence: ListePresence | null = await ListePresence.findOne({ where: { titre: req.body.titre } });

        if (listePresence != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let listePresence: ListePresence = new ListePresence();
            listePresence.titre = req.body.titre
            listePresence.description = req.body.description
            listePresence.coursId = req.body.coursId
            listePresence.enseignantId = enseignantId

            await listePresence.save()
                .then((listePresence) => {
                    return res.status(201).send(listePresence);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateListePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListePresence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listePresence: ListePresence | null = await ListePresence.findOne(options);
        if (listePresence != null) {
            if (listePresence.titre != req.body.titre && await ListePresence.findOne({ where: { titre: req.body.titre } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {
                await listePresence.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    coursId: req.body.coursId,
                    enseignantId: req.body.enseignantId,
                })
                    .then(async (listePresence) => {
                        return res.status(200).send(listePresence);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "ListePresence non trouvée" });
        }

        return null
    }

    static async deleteListePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListePresence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listePresence: ListePresence | null = await ListePresence.findOne({ where: { id: req.params.id } });
        if (listePresence) {
            await listePresence.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "ListePresence supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ListePresence non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ListePresence>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await ListePresence.count(options)
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
import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";

export default class ListePresenceController {

    constructor() { }

    static async getAllListesPresences(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListePresence>> = {
            include: [
                {
                    association: ListePresence.associations.cours, include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: ListePresence.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            ]
        }

        try {
            let listesPresences: ListePresence[];
            listesPresences = await ListePresence.findAll(options);

            return res.status(200).send(listesPresences);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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
                { association: ListePresence.associations.presences, include: [Presence.associations.presencesCoursParticipants] }
            ]
        }

        try {
            const listePresence: ListePresence | null = await ListePresence.findOne(options);

            if (listePresence == null)
                return res.status(404).json({ success: false, message: "ListePresence non trouvée" });

            return res.status(200).send(listePresence);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createListePresence(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
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
            listePresence.enseignantId = req.body.enseignantId

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
                    return res.status(500).json({ success: false, error: error });
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
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";
import { CoursParticipant } from "../models/CoursParticipant";

export default class ListePresenceController {

    constructor() { }

    static async getAllListesPresences(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const utilisateurId = (req as any).utilisateurId;
        const where: any = {};

        // Filtre : l'étudiant ne voit que les feuilles de présence de SES cours choisis
        if (role === RolesUtilisateur.APPRENANT) {
            const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
            where.coursId = { [Op.in]: coursParticipants.map(cp => cp.coursId) };
        }
        // Filtre : l'enseignant ne voit que les feuilles de présence de SES cours
        else if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
            if (enseignant) where.enseignantId = enseignant.id;
        }

        let options: FindOptions<InferAttributes<ListePresence>> = {
            where,
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
                { association: ListePresence.associations.presences, include: [Presence.associations.presencesCoursParticipants] }
            ]
        }

        try {
            const listePresence: ListePresence | null = await ListePresence.findOne(options);

            if (listePresence == null)
                return res.status(404).json({ success: false, message: "ListePresence non trouvée" });

            return res.status(200).send(listePresence);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { Presence } from "../models/Presence";
import { NoteEvaluation } from "../models/NoteEvaluation";

export default class ListeNoteEvaluationController {

    constructor() { }

    static async getAllListesNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {
            include: [
                ListeNoteEvaluation.associations.typeNoteEvaluation,              
                {
                    association: ListeNoteEvaluation.associations.cours, include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: ListeNoteEvaluation.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            ]
        }

        try {
            let listesNoteEvaluation: ListeNoteEvaluation[];
            listesNoteEvaluation = await ListeNoteEvaluation.findAll(options);

            return res.status(200).send(listesNoteEvaluation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        options = {
            where: { id: req.params.id }, include: [
                ListeNoteEvaluation.associations.typeNoteEvaluation,
                {
                    association: ListeNoteEvaluation.associations.cours,
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: ListeNoteEvaluation.associations.notesEvaluation, include: [NoteEvaluation.associations.coursParticipant] }
            ]
        }

        try {
            const listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne(options);

            if (listeNoteEvaluation == null)
                return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });

            return res.status(200).send(listeNoteEvaluation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { typeNoteEvaluationId: req.body.typeNoteEvaluationId, coursId: req.body.coursId } });

        if (listeNoteEvaluation != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let listeNoteEvaluation: ListeNoteEvaluation = new ListeNoteEvaluation();
            listeNoteEvaluation.date = req.body.date
            listeNoteEvaluation.heureDebut = req.body.heureDebut
            listeNoteEvaluation.heureFin = req.body.heureFin
            listeNoteEvaluation.commentaire = req.body.commentaire
            listeNoteEvaluation.typeNoteEvaluationId = req.body.typeNoteEvaluationId
            listeNoteEvaluation.poidsTypeNoteEvaluation = req.body.poidsTypeNoteEvaluation
            listeNoteEvaluation.coursId = req.body.coursId
            listeNoteEvaluation.enseignantId = req.body.enseignantId

            await listeNoteEvaluation.save()
                .then((listeNoteEvaluation) => {
                    return res.status(201).send(listeNoteEvaluation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne(options);
        if (listeNoteEvaluation != null) {
            await listeNoteEvaluation.update({
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                commentaire: req.body.commentaire,
                typeNoteEvaluationId: req.body.typeNoteEvaluationId,
                poidsTypeNoteEvaluation: req.body.poidsTypeNoteEvaluation,
                coursId: req.body.coursId,
                enseignantId: req.body.enseignantId,
            })
                .then(async (listeNoteEvaluation) => {
                    return res.status(200).send(listeNoteEvaluation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }

        return null
    }

    static async deleteListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { id: req.params.id } });
        if (listeNoteEvaluation) {
            await listeNoteEvaluation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "ListeNoteEvaluation supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ListeNoteEvaluation>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await ListeNoteEvaluation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
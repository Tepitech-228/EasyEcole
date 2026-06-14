import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Seance } from "../models/Seance";
import { Enseignant } from "../../auth/models/Enseignant";

export default class SeanceController {

    constructor() { }

    static async getAllSeances(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = { include: [Seance.associations.cours, { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur]}] }

        try {
            let seances: Seance[];
            seances = await Seance.findAll(options);

            return res.status(200).send(seances);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSeance(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = {}
        options = { where: { id: req.params.id }, include: [Seance.associations.cours] }

        try {
            const seance: Seance | null = await Seance.findOne(options);

            if (seance == null)
                return res.status(404).json({ success: false, message: "Seance non trouvée" });

            return res.status(200).send(seance);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createSeance(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let seance: Seance = new Seance();
        seance.titre = req.body.titre
        seance.date = req.body.date
        seance.heureDebut = req.body.heureDebut
        seance.heureFin = req.body.heureFin
        seance.description = req.body.description
        seance.coursId = req.body.coursId
        seance.enseignantId = req.body.enseignantId

        await seance.save()
            .then((seance) => {
                return res.status(201).send(seance);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateSeance(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Seance>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let seance: Seance | null = await Seance.findOne(options);
        if (seance != null) {

            await seance.update({
                titre: req.body.titre,
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                description: req.body.description,
                coursId: req.body.coursId,
                enseignantId: req.body.enseignantId,
            })
                .then(async (seance) => {
                    return res.status(200).send(seance);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    static async deleteSeance(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Seance>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let seance: Seance | null = await Seance.findOne({ where: { id: req.params.id } });
        if (seance) {
            await seance.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Seance supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Seance>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Seance.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
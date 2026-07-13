import { Request, Response } from "express";
import { ProgressionPedagogique } from "../models/ProgressionPedagogique";
import { Cours } from "../../inscription/models/Cours";
import { ChapitreCours } from "../../inscription/models/ChapitreCours";

export default class ProgressionPedagogiqueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const progressions = await ProgressionPedagogique.findAll({
                include: [
                    { association: ProgressionPedagogique.associations.cours },
                    { association: ProgressionPedagogique.associations.chapitre }
                ],
                order: [['semaine', 'ASC']]
            });
            return res.status(200).send(progressions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const progression = await ProgressionPedagogique.findOne({
                where: { id: req.params.id },
                include: [
                    { association: ProgressionPedagogique.associations.cours },
                    { association: ProgressionPedagogique.associations.chapitre }
                ]
            });
            if (progression == null)
                return res.status(404).json({ success: false, message: "Progression non trouvée" });
            return res.status(200).send(progression);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByCours(req: Request, res: Response): Promise<Response> {
        try {
            const progressions = await ProgressionPedagogique.findAll({
                where: { coursId: req.params.coursId },
                include: [{ association: ProgressionPedagogique.associations.chapitre }],
                order: [['semaine', 'ASC']]
            });
            return res.status(200).send(progressions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const progression = await ProgressionPedagogique.create({
                coursId: req.body.coursId,
                semaine: req.body.semaine,
                chapitreId: req.body.chapitreId || null,
                volumeHoraire: req.body.volumeHoraire,
                statut: req.body.statut || 'planifie'
            });
            return res.status(201).send(progression);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const progression = await ProgressionPedagogique.findOne({ where: { id: req.params.id } });
            if (progression == null)
                return res.status(404).json({ success: false, message: "Progression non trouvée" });

            await progression.update(req.body);
            return res.status(200).send(progression);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const progression = await ProgressionPedagogique.findOne({ where: { id: req.params.id } });
            if (progression == null)
                return res.status(404).json({ success: false, message: "Progression non trouvée" });

            await progression.destroy();
            return res.status(200).json({ success: true, message: "Progression supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
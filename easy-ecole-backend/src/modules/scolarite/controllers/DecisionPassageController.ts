import { Request, Response } from "express";
import { DecisionPassage } from "../models/DecisionPassage";

export default class DecisionPassageController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DecisionPassage.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await DecisionPassage.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Decision non trouvée" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let item = new DecisionPassage();
        item.cursusApprenantId = req.body.cursusApprenantId;
        item.anneeAcademiqueId = req.body.anneeAcademiqueId;
        item.moyenneGenerale = req.body.moyenneGenerale;
        item.creditsAcquis = req.body.creditsAcquis;
        item.creditsRequis = req.body.creditsRequis;
        item.decision = req.body.decision;
        item.dateDecision = req.body.dateDecision;
        item.validePar = req.body.validePar;

        await item.save()
            .then(async (item) => {
                return res.status(201).send(item);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let item = await DecisionPassage.findOne({ where: { id: req.params.id } });
        if (item != null) {
            await item.update(req.body)
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Decision non trouvée" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let item = await DecisionPassage.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Decision supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Decision non trouvée" });
        }

        return null;
    }

    static async getByCursus(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DecisionPassage.findAll({ where: { cursusApprenantId: req.params.cursusId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByAnnee(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DecisionPassage.findAll({ where: { anneeAcademiqueId: req.params.anneeId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

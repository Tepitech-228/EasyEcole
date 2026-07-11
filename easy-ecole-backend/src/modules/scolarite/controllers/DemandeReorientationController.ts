import { Request, Response } from "express";
import { DemandeReorientation } from "../models/DemandeReorientation";

export default class DemandeReorientationController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandeReorientation.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await DemandeReorientation.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let item = new DemandeReorientation();
        item.cursusApprenantId = req.body.cursusApprenantId;
        item.parcoursActuelId = req.body.parcoursActuelId;
        item.parcoursCibleId = req.body.parcoursCibleId;
        item.motif = req.body.motif;

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
        let item = await DemandeReorientation.findOne({ where: { id: req.params.id } });
        if (item != null) {
            await item.update(req.body)
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null;
    }

    static async traiter(req: Request, res: Response): Promise<Response | null> {
        let item = await DemandeReorientation.findOne({ where: { id: req.params.id } });
        if (item != null) {
            item.statut = req.body.statut;
            item.dateTraitement = new Date();
            item.traitePar = req.body.traitePar;
            await item.save()
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null;
    }
}

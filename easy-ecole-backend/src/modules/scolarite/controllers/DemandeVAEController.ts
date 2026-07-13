import { Request, Response } from "express";
import { DemandeVAE } from "../models/DemandeVAE";

export default class DemandeVAEController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await DemandeVAE.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await DemandeVAE.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Demande VAE non trouvée" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let item = new DemandeVAE();
        item.utilisateurId = req.body.utilisateurId;
        item.type = req.body.type;
        item.parcoursCibleId = req.body.parcoursCibleId;
        item.justificatifs = req.body.justificatifs;

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
        let item = await DemandeVAE.findOne({ where: { id: req.params.id } });
        if (item != null) {
            await item.update(req.body)
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande VAE non trouvée" });
        }

        return null;
    }

    static async traiter(req: Request, res: Response): Promise<Response | null> {
        let item = await DemandeVAE.findOne({ where: { id: req.params.id } });
        if (item != null) {
            item.statut = req.body.statut;
            await item.save()
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande VAE non trouvée" });
        }

        return null;
    }
}

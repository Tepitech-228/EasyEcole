import { Request, Response } from "express";
import { EvenementCalendrier } from "../models/EvenementCalendrier";

export default class EvenementCalendrierController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const evenements = await EvenementCalendrier.findAll({ order: [['date', 'ASC']] });
            return res.status(200).send(evenements);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
            if (evenement == null)
                return res.status(404).json({ success: false, message: "Événement non trouvé" });
            return res.status(200).send(evenement);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let evenement = new EvenementCalendrier();
        evenement.titre = req.body.titre;
        evenement.date = req.body.date;
        evenement.description = req.body.description;
        evenement.type = req.body.type;

        await evenement.save()
            .then(async (evenement) => {
                return res.status(201).send(evenement);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
        if (evenement != null) {
            await evenement.update(req.body)
                .then(async (evenement) => {
                    return res.status(200).send(evenement);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Événement non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
        if (evenement) {
            await evenement.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Événement supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Événement non trouvé" });
        }

        return null;
    }
}

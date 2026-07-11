import { Request, Response } from "express";
import { Op } from "sequelize";
import { SanctionAcademique } from "../models/SanctionAcademique";

export default class SanctionAcademiqueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await SanctionAcademique.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await SanctionAcademique.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Sanction non trouvée" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let item = new SanctionAcademique();
        item.cursusApprenantId = req.body.cursusApprenantId;
        item.type = req.body.type;
        item.dateDebut = req.body.dateDebut;
        item.dateFin = req.body.dateFin;
        item.motif = req.body.motif;
        item.decidePar = req.body.decidePar;

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
        let item = await SanctionAcademique.findOne({ where: { id: req.params.id } });
        if (item != null) {
            await item.update(req.body)
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Sanction non trouvée" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let item = await SanctionAcademique.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Sanction supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Sanction non trouvée" });
        }

        return null;
    }

    static async getByCursus(req: Request, res: Response): Promise<Response> {
        try {
            const items = await SanctionAcademique.findAll({ where: { cursusApprenantId: req.params.cursusId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getActives(req: Request, res: Response): Promise<Response> {
        try {
            const items = await SanctionAcademique.findAll({
                where: {
                    [Op.or]: [
                        { dateFin: null },
                        { dateFin: { [Op.gt]: new Date() } }
                    ]
                }
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

import { Request, Response } from "express";
import { Op } from "sequelize";
import { Diplome } from "../models/Diplome";

export default class DiplomeController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Diplome.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Diplome.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Diplôme non trouvé" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let item = new Diplome();
        item.cursusApprenantId = req.body.cursusApprenantId;
        item.parcoursId = req.body.parcoursId;
        item.niveauEtudeId = req.body.niveauEtudeId;
        item.anneeObtention = req.body.anneeObtention;
        item.mention = req.body.mention;
        item.numeroDiplome = req.body.numeroDiplome;
        item.dateDelivrance = req.body.dateDelivrance;
        item.fichierPDF = req.body.fichierPDF;

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
        let item = await Diplome.findOne({ where: { id: req.params.id } });
        if (item != null) {
            await item.update(req.body)
                .then(async (item) => {
                    return res.status(200).send(item);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Diplôme non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let item = await Diplome.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Diplôme supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Diplôme non trouvé" });
        }

        return null;
    }

    static async genererNumero(req: Request, res: Response): Promise<Response> {
        try {
            const annee = req.params.annee || new Date().getFullYear().toString();
            const count = await Diplome.count({
                where: {
                    anneeObtention: { [Op.eq]: parseInt(annee) }
                }
            });
            const numero = `DIP-${annee}-${(count + 1).toString().padStart(5, '0')}`;
            return res.status(200).json({ numero: numero });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByCursus(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Diplome.findAll({ where: { cursusApprenantId: req.params.cursusId } });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

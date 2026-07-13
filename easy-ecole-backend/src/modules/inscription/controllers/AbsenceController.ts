import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Absence } from "../models/Absence";

export default class AbsenceController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Absence>> = { include: [{ all: true }] }
        try {
            let data = await Absence.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Absence.findByPk(req.params.id, { include: [{ all: true }] });
            if (!data) return res.status(404).json({ success: false, message: "Absence non trouvée" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Absence.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Absence.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Absence non trouvée" });
            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Absence.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Absence non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByNoteEvaluation(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Absence.findOne({
                where: { noteEvaluationId: req.params.noteEvaluationId },
                include: [{ all: true }]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

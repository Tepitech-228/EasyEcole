import { Request, Response } from "express";
import { AuditNote } from "../models/AuditNote";

export default class AuditNoteController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            if (req.query.noteEvaluationId) where.noteEvaluationId = req.query.noteEvaluationId;
            if (req.query.modifiePar) where.modifiePar = req.query.modifiePar;
            let data = await AuditNote.findAll({
                where,
                include: [{ all: true }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByNote(req: Request, res: Response): Promise<Response> {
        try {
            const data = await AuditNote.findAll({
                where: { noteEvaluationId: req.params.noteEvaluationId },
                include: [{ all: true }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}

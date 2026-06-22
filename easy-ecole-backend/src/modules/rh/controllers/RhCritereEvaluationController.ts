import { Request, Response } from "express";
import { RhCritereEvaluation } from "../models/RhCritereEvaluation";

export default class RhCritereEvaluationController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCritereEvaluation.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCritereEvaluation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Critère non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCritereEvaluation.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCritereEvaluation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Critère non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCritereEvaluation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Critère non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Critère supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

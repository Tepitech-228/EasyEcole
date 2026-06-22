import { Request, Response } from "express";
import { RhEvaluationCritere } from "../models/RhEvaluationCritere";

export default class RhEvaluationCritereController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEvaluationCritere.findAll({ include: [RhEvaluationCritere.associations.fiche, RhEvaluationCritere.associations.critere] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEvaluationCritere.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Évaluation critère non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEvaluationCritere.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEvaluationCritere.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Évaluation critère non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEvaluationCritere.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Évaluation critère non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Évaluation critère supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

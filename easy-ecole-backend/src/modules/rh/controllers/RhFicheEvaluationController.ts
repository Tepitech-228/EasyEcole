import { Request, Response } from "express";
import { RhFicheEvaluation } from "../models/RhFicheEvaluation";
import { RhEvaluationCritere } from "../models/RhEvaluationCritere";

export default class RhFicheEvaluationController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFicheEvaluation.findAll({ include: [RhFicheEvaluation.associations.employe, RhFicheEvaluation.associations.evaluationsCriteres] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFicheEvaluation.findOne({ where: { id: req.params.id }, include: [RhFicheEvaluation.associations.employe, { association: RhFicheEvaluation.associations.evaluationsCriteres, include: [RhEvaluationCritere.associations.critere] }] });
      if (!data) return res.status(404).json({ success: false, message: "Fiche d'évaluation non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFicheEvaluation.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFicheEvaluation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Fiche d'évaluation non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFicheEvaluation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Fiche d'évaluation non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Fiche d'évaluation supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

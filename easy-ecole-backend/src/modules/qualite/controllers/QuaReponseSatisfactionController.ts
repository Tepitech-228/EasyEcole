import { Request, Response } from "express";
import { QuaReponseSatisfaction } from "../models/QuaReponseSatisfaction";

export default class QuaReponseSatisfactionController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.enqueteSatisfactionId) where.enqueteSatisfactionId = req.query.enqueteSatisfactionId;
      const data = await QuaReponseSatisfaction.findAll({ where, order: [['soumiseLe', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaReponseSatisfaction.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Réponse non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaReponseSatisfaction.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaReponseSatisfaction.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Réponse non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaReponseSatisfaction.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Réponse non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Réponse supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

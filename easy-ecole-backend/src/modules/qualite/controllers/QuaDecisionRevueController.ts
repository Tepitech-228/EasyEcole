import { Request, Response } from "express";
import { QuaDecisionRevue } from "../models/QuaDecisionRevue";

export default class QuaDecisionRevueController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.revueDirectionId) where.revueDirectionId = req.query.revueDirectionId;
      const data = await QuaDecisionRevue.findAll({ where, order: [['createdAt', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaDecisionRevue.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Décision non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaDecisionRevue.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaDecisionRevue.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Décision non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaDecisionRevue.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Décision non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Décision supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

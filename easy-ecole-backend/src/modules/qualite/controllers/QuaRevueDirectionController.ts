import { Request, Response } from "express";
import { QuaRevueDirection } from "../models/QuaRevueDirection";
import { QuaDecisionRevue } from "../models/QuaDecisionRevue";

export default class QuaRevueDirectionController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaRevueDirection.findAll({ include: [{ model: QuaDecisionRevue, as: 'decisions' }], order: [['dateTenue', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaRevueDirection.findByPk(req.params.id, { include: [{ model: QuaDecisionRevue, as: 'decisions' }] });
      if (!data) return res.status(404).json({ success: false, message: "Revue de direction non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaRevueDirection.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaRevueDirection.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Revue de direction non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaRevueDirection.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Revue de direction non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Revue de direction supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await QuaRevueDirection.count();
      return res.status(200).json({ success: true, count });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

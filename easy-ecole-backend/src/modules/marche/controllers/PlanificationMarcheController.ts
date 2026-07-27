import { Request, Response } from "express";
import { PlanificationMarche } from "../models/PlanificationMarche";

export default class PlanificationMarcheController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const items = await PlanificationMarche.findAll();
      return res.status(200).send(items);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const item = await PlanificationMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Planification non trouvée" });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await PlanificationMarche.create(req.body);
      return res.status(201).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const item = await PlanificationMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Planification non trouvée" });
      await item.update(req.body);
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const item = await PlanificationMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Planification non trouvée" });
      await item.destroy();
      return res.status(200).json({ success: true, message: "Planification supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }
}

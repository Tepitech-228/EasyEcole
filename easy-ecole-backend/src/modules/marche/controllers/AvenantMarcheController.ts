import { Request, Response } from "express";
import { AvenantMarche } from "../models/AvenantMarche";

export default class AvenantMarcheController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const items = await AvenantMarche.findAll();
      return res.status(200).send(items);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AvenantMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Avenant non trouvé" });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AvenantMarche.create(req.body);
      return res.status(201).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AvenantMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Avenant non trouvé" });
      await item.update(req.body);
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AvenantMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Avenant non trouvé" });
      await item.destroy();
      return res.status(200).json({ success: true, message: "Avenant supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }
}

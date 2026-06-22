import { Request, Response } from "express";
import { RhTypeContrat } from "../models/RhTypeContrat";

export default class RhTypeContratController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhTypeContrat.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhTypeContrat.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type de contrat non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const existing = await RhTypeContrat.findOne({ where: { code: req.body.code } });
      if (existing) return res.status(400).json({ success: false, alreadyExists: true });
      const data = await RhTypeContrat.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhTypeContrat.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type de contrat non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhTypeContrat.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type de contrat non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Type de contrat supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

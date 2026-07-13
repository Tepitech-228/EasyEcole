import { Request, Response } from "express";
import { RhEntretien } from "../models/RhEntretien";

export default class RhEntretienController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEntretien.findAll({ include: [RhEntretien.associations.candidature] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEntretien.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Entretien non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEntretien.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEntretien.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Entretien non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEntretien.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Entretien non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Entretien supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

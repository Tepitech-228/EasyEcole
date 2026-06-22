import { Request, Response } from "express";
import { RhFormation } from "../models/RhFormation";

export default class RhFormationController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFormation.findAll({ include: [RhFormation.associations.participations] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFormation.findOne({ where: { id: req.params.id }, include: [RhFormation.associations.participations] });
      if (!data) return res.status(404).json({ success: false, message: "Formation non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFormation.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFormation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Formation non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhFormation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Formation non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Formation supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { RhParticipationFormation } from "../models/RhParticipationFormation";

export default class RhParticipationFormationController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhParticipationFormation.findAll({ include: [RhParticipationFormation.associations.formation, RhParticipationFormation.associations.employe] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhParticipationFormation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Participation non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhParticipationFormation.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhParticipationFormation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Participation non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhParticipationFormation.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Participation non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Participation supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

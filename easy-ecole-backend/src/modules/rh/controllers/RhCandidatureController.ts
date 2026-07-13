import { Request, Response } from "express";
import { RhCandidature } from "../models/RhCandidature";

export default class RhCandidatureController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCandidature.findAll({ include: [RhCandidature.associations.offre] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCandidature.findOne({ where: { id: req.params.id }, include: [RhCandidature.associations.offre, RhCandidature.associations.entretiens] });
      if (!data) return res.status(404).json({ success: false, message: "Candidature non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCandidature.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCandidature.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Candidature non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCandidature.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Candidature non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Candidature supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

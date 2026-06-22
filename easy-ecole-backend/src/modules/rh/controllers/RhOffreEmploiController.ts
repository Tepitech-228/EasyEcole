import { Request, Response } from "express";
import { RhOffreEmploi } from "../models/RhOffreEmploi";

export default class RhOffreEmploiController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhOffreEmploi.findAll({ include: [RhOffreEmploi.associations.poste] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhOffreEmploi.findOne({ where: { id: req.params.id }, include: [RhOffreEmploi.associations.poste, RhOffreEmploi.associations.candidatures] });
      if (!data) return res.status(404).json({ success: false, message: "Offre d'emploi non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhOffreEmploi.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhOffreEmploi.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Offre d'emploi non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhOffreEmploi.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Offre d'emploi non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Offre d'emploi supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

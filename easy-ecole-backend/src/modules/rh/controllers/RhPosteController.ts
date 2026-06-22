import { Request, Response } from "express";
import { RhPoste } from "../models/RhPoste";

export default class RhPosteController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPoste.findAll({ include: [RhPoste.associations.departement, RhPoste.associations.offresEmploi] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPoste.findOne({ where: { id: req.params.id }, include: [RhPoste.associations.departement] });
      if (!data) return res.status(404).json({ success: false, message: "Poste non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPoste.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPoste.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Poste non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPoste.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Poste non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Poste supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

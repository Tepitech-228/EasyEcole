import { Request, Response } from "express";
import { RhCategorieProfessionnelle } from "../models/RhCategorieProfessionnelle";

export default class RhCategorieProfessionnelleController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCategorieProfessionnelle.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCategorieProfessionnelle.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Catégorie professionnelle non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const existing = await RhCategorieProfessionnelle.findOne({ where: { code: req.body.code } });
      if (existing) return res.status(400).json({ success: false, alreadyExists: true });
      const data = await RhCategorieProfessionnelle.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCategorieProfessionnelle.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Catégorie professionnelle non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhCategorieProfessionnelle.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Catégorie professionnelle non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Catégorie professionnelle supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

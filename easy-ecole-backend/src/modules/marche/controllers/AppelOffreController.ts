import { Request, Response } from "express";
import { AppelOffre } from "../models/AppelOffre";

export default class AppelOffreController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const items = await AppelOffre.findAll();
      return res.status(200).send(items);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Appel d'offres non trouvé" });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.create(req.body);
      return res.status(201).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Appel d'offres non trouvé" });
      await item.update(req.body);
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Appel d'offres non trouvé" });
      await item.destroy();
      return res.status(200).json({ success: true, message: "Appel d'offres supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async lancer(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Appel d'offres non trouvé" });
      await item.update({ statut: 'lance' });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async attribuer(req: Request, res: Response): Promise<Response> {
    try {
      const item = await AppelOffre.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Appel d'offres non trouvé" });
      await item.update({ statut: 'attribue' });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }
}

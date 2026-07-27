import { Request, Response } from "express";
import { ManifestationInteret } from "../models/ManifestationInteret";

export default class ManifestationInteretController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const items = await ManifestationInteret.findAll();
      return res.status(200).send(items);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "AMI non trouvée" });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.create(req.body);
      return res.status(201).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "AMI non trouvée" });
      await item.update(req.body);
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "AMI non trouvée" });
      await item.destroy();
      return res.status(200).json({ success: true, message: "AMI supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async soumettre(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "AMI non trouvée" });
      await item.update({ statut: 'deposee' });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async retenir(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ManifestationInteret.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "AMI non trouvée" });
      await item.update({ statut: 'retenue' });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }
}

import { Request, Response } from "express";
import { ContratMarche } from "../models/ContratMarche";

export default class ContratMarcheController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const items = await ContratMarche.findAll();
      return res.status(200).send(items);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ContratMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ContratMarche.create(req.body);
      return res.status(201).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ContratMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await item.update(req.body);
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ContratMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await item.destroy();
      return res.status(200).json({ success: true, message: "Contrat supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }

  static async signer(req: Request, res: Response): Promise<Response> {
    try {
      const item = await ContratMarche.findByPk(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await item.update({ statut: 'signe', dateSignature: new Date() });
      return res.status(200).send(item);
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  }
}

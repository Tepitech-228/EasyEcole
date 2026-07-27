import { Request, Response } from "express";
import { CompteBancaire } from "../models/CompteBancaire";
import { ReleveBancaire } from "../models/ReleveBancaire";

export default class CompteBancaireController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await CompteBancaire.findAll({ order: [['banque', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await CompteBancaire.findByPk(req.params.id, { include: [{ model: ReleveBancaire, as: 'releves' }] });
      if (!data) return res.status(404).json({ success: false, message: "Compte bancaire non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await CompteBancaire.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await CompteBancaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Compte bancaire non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await CompteBancaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Compte bancaire non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Compte bancaire supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

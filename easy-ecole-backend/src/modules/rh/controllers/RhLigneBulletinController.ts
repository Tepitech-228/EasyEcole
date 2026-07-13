import { Request, Response } from "express";
import { RhLigneBulletin } from "../models/RhLigneBulletin";

export default class RhLigneBulletinController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhLigneBulletin.findAll({ include: [RhLigneBulletin.associations.bulletin, RhLigneBulletin.associations.rubrique] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhLigneBulletin.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne bulletin non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhLigneBulletin.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhLigneBulletin.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne bulletin non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhLigneBulletin.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne bulletin non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Ligne bulletin supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

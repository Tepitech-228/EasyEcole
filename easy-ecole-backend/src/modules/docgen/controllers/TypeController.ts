import { Request, Response } from "express";
import { DocGenType } from "../models/DocGenType";

export default class TypeController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const types = await DocGenType.findAll({
        order: [['categorie', 'ASC'], ['code', 'ASC']]
      });
      return res.status(200).json(types);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const type = await DocGenType.findByPk(req.params.id);
      if (!type) return res.status(404).json({ success: false, message: 'Type non trouvé' });
      return res.status(200).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const existing = await DocGenType.findOne({ where: { code: req.body.code } });
      if (existing) return res.status(400).json({ success: false, message: 'Ce code existe déjà' });
      const type = await DocGenType.create(req.body);
      return res.status(201).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const type = await DocGenType.findByPk(req.params.id);
      if (!type) return res.status(404).json({ success: false, message: 'Type non trouvé' });
      await type.update(req.body);
      return res.status(200).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const type = await DocGenType.findByPk(req.params.id);
      if (!type) return res.status(404).json({ success: false, message: 'Type non trouvé' });
      await type.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

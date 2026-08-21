import { Request, Response } from "express";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";

export default class TypeOperationBordereauController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.findAll({
        order: [['libelle', 'ASC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getActive(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.findAll({
        where: { actif: true },
        order: [['libelle', 'ASC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type d'opération non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.create(req.body);
      return res.status(201).send(data);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Ce code existe déjà" });
      }
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type d'opération non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Ce code existe déjà" });
      }
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await TypeOperationBordereau.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Type d'opération non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Type d'opération supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

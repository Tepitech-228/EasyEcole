import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RhDepartement } from "../models/RhDepartement";
import { RhEmploye } from "../models/RhEmploye";

export default class RhDepartementController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDepartement.findAll({ include: [RhDepartement.associations.employes, RhDepartement.associations.postes] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDepartement.findOne({ where: { id: req.params.id }, include: [RhDepartement.associations.employes, RhDepartement.associations.postes] });
      if (!data) return res.status(404).json({ success: false, message: "Département non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const existing = await RhDepartement.findOne({ where: { nom: req.body.nom } });
      if (existing) return res.status(400).json({ success: false, alreadyExists: true });
      const data = await RhDepartement.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDepartement.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Département non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDepartement.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Département non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Département supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { RhEmploye } from "../models/RhEmploye";

export default class RhEmployeController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.findAll({ include: [RhEmploye.associations.poste, RhEmploye.associations.departement, RhEmploye.associations.typeContrat] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.findOne({ where: { id: req.params.id }, include: [RhEmploye.associations.poste, RhEmploye.associations.departement, RhEmploye.associations.typeContrat] });
      if (!data) return res.status(404).json({ success: false, message: "Employé non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Employé non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Employé non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Employé supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await RhEmploye.count();
      return res.status(200).json({ success: true, count });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

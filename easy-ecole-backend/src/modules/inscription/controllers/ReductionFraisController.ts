import { Request, Response } from "express";
import { ReductionFrais } from "../models/ReductionFrais";
import { FraisParcours } from "../models/FraisParcours";

export default class ReductionFraisController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.findAll({
        include: [ReductionFrais.associations.fraisParcours]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.findByPk(req.params.id, {
        include: [ReductionFrais.associations.fraisParcours]
      });
      if (!data) return res.status(404).json({ success: false, message: "Réduction non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Réduction non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Réduction non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Réduction supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByFraisParcours(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReductionFrais.findAll({
        where: { fraisParcoursId: req.params.fraisParcoursId }
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

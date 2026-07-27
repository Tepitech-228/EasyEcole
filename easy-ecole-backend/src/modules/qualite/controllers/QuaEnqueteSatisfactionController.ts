import { Request, Response } from "express";
import { QuaEnqueteSatisfaction } from "../models/QuaEnqueteSatisfaction";
import { QuaReponseSatisfaction } from "../models/QuaReponseSatisfaction";

export default class QuaEnqueteSatisfactionController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaEnqueteSatisfaction.findAll({
        include: [{ model: QuaReponseSatisfaction, as: 'reponses' }],
        order: [['dateDebut', 'DESC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaEnqueteSatisfaction.findByPk(req.params.id, {
        include: [{ model: QuaReponseSatisfaction, as: 'reponses' }]
      });
      if (!data) return res.status(404).json({ success: false, message: "Enquête non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaEnqueteSatisfaction.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaEnqueteSatisfaction.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Enquête non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaEnqueteSatisfaction.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Enquête non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Enquête supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getStatistiques(req: Request, res: Response): Promise<Response> {
    try {
      const enquete = await QuaEnqueteSatisfaction.findByPk(req.params.id, {
        include: [{ model: QuaReponseSatisfaction, as: 'reponses' }]
      });
      if (!enquete) return res.status(404).json({ success: false, message: "Enquête non trouvée" });
      const total = enquete.reponses?.length || 0;
      return res.status(200).json({ success: true, total, enquete });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

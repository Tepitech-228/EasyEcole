import { Request, Response } from "express";
import { RptAchat } from "../models/RptAchat";
import { RptStock } from "../models/RptStock";
import { RptImmobilisation } from "../models/RptImmobilisation";

export default class RapportAchatsController {

  static async getAchats(req: Request, res: Response): Promise<Response> {
    try {
      const { categorieId, periode } = req.query;
      const where: any = {};
      if (categorieId) where.categorieId = categorieId;
      if (periode) where.periode = periode;
      const data = await RptAchat.findAll({ where, order: [['periode', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getStocks(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RptStock.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getImmobilisations(req: Request, res: Response): Promise<Response> {
    try {
      const { categorieId } = req.query;
      const where: any = {};
      if (categorieId) where.categorieId = categorieId;
      const data = await RptImmobilisation.findAll({ where });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

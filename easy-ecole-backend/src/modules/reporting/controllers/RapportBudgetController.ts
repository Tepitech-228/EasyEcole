import { Request, Response } from "express";
import { RptBudgetVsReel } from "../models/RptBudgetVsReel";

export default class RapportBudgetController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { departementId, periode } = req.query;
      const where: any = {};
      if (departementId) where.departementId = departementId;
      if (periode) where.periode = periode;
      const data = await RptBudgetVsReel.findAll({ where, order: [['periode', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getEcart(req: Request, res: Response): Promise<Response> {
    try {
      const totalPrevu = await RptBudgetVsReel.sum('budgetPrevu');
      const totalReel = await RptBudgetVsReel.sum('budgetReel');
      const ecartTotal = totalPrevu - totalReel;
      return res.status(200).json({ totalPrevu, totalReel, ecartTotal });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

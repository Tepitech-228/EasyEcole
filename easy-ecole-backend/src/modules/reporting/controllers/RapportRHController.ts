import { Request, Response } from "express";
import { RptEffectifRh } from "../models/RptEffectifRh";
import { RptPaie } from "../models/RptPaie";
import { RptFormationRh } from "../models/RptFormationRh";
import { RptEvaluation } from "../models/RptEvaluation";

export default class RapportRHController {

  static async getEffectifs(req: Request, res: Response): Promise<Response> {
    try {
      const { departementId } = req.query;
      const where: any = {};
      if (departementId) where.departementId = departementId;
      const data = await RptEffectifRh.findAll({ where, order: [['date', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getPaie(req: Request, res: Response): Promise<Response> {
    try {
      const { periode } = req.query;
      const where: any = {};
      if (periode) where.periode = periode;
      const data = await RptPaie.findAll({ where, order: [['periode', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getFormations(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RptFormationRh.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getEvaluations(req: Request, res: Response): Promise<Response> {
    try {
      const { periode } = req.query;
      const where: any = {};
      if (periode) where.periode = periode;
      const data = await RptEvaluation.findAll({ where, order: [['periode', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

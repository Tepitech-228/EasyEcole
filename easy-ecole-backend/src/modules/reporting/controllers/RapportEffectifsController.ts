import { Request, Response } from "express";
import { RptEffectif } from "../models/RptEffectif";

export default class RapportEffectifsController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { classeId, periode } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (periode) where.periode = periode;
      const data = await RptEffectif.findAll({ where, order: [['periode', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getSummary(req: Request, res: Response): Promise<Response> {
    try {
      const totalInscrits = await RptEffectif.sum('nbInscrits');
      const totalActifs = await RptEffectif.sum('nbActifs');
      const totalHommes = await RptEffectif.sum('nbHommes');
      const totalFemmes = await RptEffectif.sum('nbFemmes');
      return res.status(200).json({ totalInscrits, totalActifs, totalHommes, totalFemmes });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

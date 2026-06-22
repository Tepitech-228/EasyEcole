import { Request, Response } from "express";
import { RptNoteMoyenne } from "../models/RptNoteMoyenne";
import { RptReussite } from "../models/RptReussite";

export default class RapportNotesController {

  static async getMoyennes(req: Request, res: Response): Promise<Response> {
    try {
      const { classeId, matiereId, periode } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (matiereId) where.matiereId = matiereId;
      if (periode) where.periode = periode;
      const data = await RptNoteMoyenne.findAll({ where, order: [['periode', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getReussite(req: Request, res: Response): Promise<Response> {
    try {
      const { classeId, annee } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (annee) where.annee = annee;
      const data = await RptReussite.findAll({ where, order: [['annee', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

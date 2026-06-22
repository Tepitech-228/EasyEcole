import { Request, Response } from "express";
import { RptPaiement } from "../models/RptPaiement";
import { RptFacture } from "../models/RptFacture";

export default class RapportPaiementsController {

  static async getPaiements(req: Request, res: Response): Promise<Response> {
    try {
      const { dateDebut, dateFin, modePaiement } = req.query;
      const where: any = {};
      if (dateDebut && dateFin) {
        where.date = { $between: [dateDebut, dateFin] };
      }
      if (modePaiement) where.modePaiement = modePaiement;
      const data = await RptPaiement.findAll({ where, order: [['date', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getFactures(req: Request, res: Response): Promise<Response> {
    try {
      const { mois, statut } = req.query;
      const where: any = {};
      if (mois) where.mois = mois;
      if (statut) where.statut = statut;
      const data = await RptFacture.findAll({ where, order: [['mois', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getTotaux(req: Request, res: Response): Promise<Response> {
    try {
      const totalMontant = await RptPaiement.sum('montantTotal');
      const totalTransactions = await RptPaiement.sum('nbTransactions');
      return res.status(200).json({ totalMontant, totalTransactions });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

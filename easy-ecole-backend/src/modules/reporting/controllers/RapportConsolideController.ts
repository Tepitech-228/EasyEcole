import { Request, Response } from "express";
import { RptEffectif } from "../models/RptEffectif";
import { RptPaiement } from "../models/RptPaiement";
import { RptInscription } from "../models/RptInscription";

export default class RapportConsolideController {

  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const totalApprenants = await RptEffectif.sum('nbActifs');
      const totalPaiements = await RptPaiement.sum('montantTotal');
      const totalInscrits = await RptInscription.sum('nbInscrits');
      const totalMontantInsc = await RptInscription.sum('montantTotal');

      return res.status(200).json({
        totalApprenants,
        totalPaiements,
        totalInscrits,
        totalMontantInscriptions: totalMontantInsc,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

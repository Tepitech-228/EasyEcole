import { Request, Response } from "express";
import { SecretariatService } from "../services/SecretariatService";

export default class SecretariatDashboardController {

  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await SecretariatService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('[SECRETARIAT][Dashboard]', error);
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: "Erreur lors du chargement du tableau de bord" });
    }
  }

  static async getRecentActivity(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const activity = await SecretariatService.getRecentActivity(limit);
      return res.status(200).json(activity);
    } catch (error) {
      console.error('[SECRETARIAT][Dashboard]', error);
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: "Erreur lors du chargement du tableau de bord" });
    }
  }
}

import { Request, Response } from "express";
import { ProgressionApprenant } from "../models/ProgressionApprenant";
import { ModuleElearning } from "../models/ModuleElearning";
import { Support } from "../models/Support";
import { CoursEnLigne } from "../models/CoursEnLigne";

export default class ProgressionApprenantController {

  static async marquerTermine(req: Request, res: Response): Promise<Response> {
    try {
      const apprenantId = (req as any).utilisateurId;
      const { supportId } = req.body;

      const [progression, created] = await ProgressionApprenant.findOrCreate({
        where: { supportId, apprenantId },
        defaults: { supportId, apprenantId, termine: true, tempsPasse: req.body.tempsPasse || 0, dernierAcces: new Date() }
      });

      if (!created) {
        await progression.update({ termine: true, dernierAcces: new Date(), tempsPasse: req.body.tempsPasse || progression.tempsPasse });
      }

      return res.status(200).send(progression);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getProgressionCours(req: Request, res: Response): Promise<Response> {
    try {
      const apprenantId = (req as any).utilisateurId;
      const coursId = req.params.coursId;

      const supports = await Support.findAll({
        include: [{
          model: ModuleElearning,
          as: 'module',
          where: { coursId },
          attributes: []
        }],
        attributes: ['id']
      });

      const supportIds = supports.map(s => s.id);
      const progressions = await ProgressionApprenant.findAll({
        where: { apprenantId, supportId: supportIds }
      });

      const total = supportIds.length;
      const termine = progressions.filter(p => p.termine).length;
      const progressionMap: Record<string, any> = {};
      for (const p of progressions) {
        progressionMap[p.supportId] = { termine: p.termine, tempsPasse: p.tempsPasse, dernierAcces: p.dernierAcces };
      }

      return res.status(200).json({ total, termine, progressionMap, taux: total > 0 ? Math.round((termine / total) * 100) : 0 });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

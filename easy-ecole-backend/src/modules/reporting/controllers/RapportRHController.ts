import { Request, Response } from "express";
import { RptFormationRh } from "../models/RptFormationRh";
import { RptEvaluation } from "../models/RptEvaluation";
import { RhEmploye } from "../../rh/models/RhEmploye";
import { RhBulletinPaie } from "../../rh/models/RhBulletinPaie";
import { RhPeriodePaie } from "../../rh/models/RhPeriodePaie";

export default class RapportRHController {

  static async getEffectifs(req: Request, res: Response): Promise<Response> {
    try {
      const { departementId } = req.query;
      const where: any = {};
      if (departementId) where.departementId = departementId;

      const totalEmployes = await RhEmploye.count({ where });
      const actifs = await RhEmploye.count({ where: { ...where, statut: 'actif' } });

      return res.status(200).send([
        {
          date: new Date().toISOString().slice(0, 10),
          nbEmployes: totalEmployes,
          nbActifs: actifs,
          departementId: departementId || null
        }
      ]);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getPaie(req: Request, res: Response): Promise<Response> {
    try {
      const { periode } = req.query;
      const where: any = {};
      if (periode) where.periodeId = periode;

      const bulletins = await RhBulletinPaie.findAll({
        where,
        include: [{ model: RhPeriodePaie, as: 'periode', attributes: ['mois', 'annee'] }],
        attributes: ['totalGains', 'totalRetenues', 'netAPayer'],
        order: [['createdAt', 'DESC']]
      });

      const data = bulletins.map((b: any) => ({
        periode: b.periode ? `${['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][b.periode.mois]} ${b.periode.annee}` : 'N/A',
        totalGains: Number(b.totalGains) || 0,
        totalRetenues: Number(b.totalRetenues) || 0,
        netTotal: Number(b.netAPayer) || 0,
        nbBulletins: bulletins.length
      }));

      return res.status(200).send(data.length > 0 ? data : [{ periode: 'Aucune donnée', totalGains: 0, totalRetenues: 0, netTotal: 0, nbBulletins: 0 }]);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getFormations(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RptFormationRh.findAll({
        attributes: ['id', 'formationId', 'nbParticipants', 'coutTotal', 'dureeTotale']
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
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
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}

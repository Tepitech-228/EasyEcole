import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { RhEmploye } from "../models/RhEmploye";
import { RhPoste } from "../models/RhPoste";
import { RhDepartement } from "../models/RhDepartement";
import { RhBulletinPaie } from "../models/RhBulletinPaie";
import { RhPeriodePaie } from "../models/RhPeriodePaie";
import { RhPret } from "../models/RhPret";
import { RhHeureSupplementaire } from "../models/RhHeureSupplementaire";
import { RhPrestationEnseignant } from "../models/RhPrestationEnseignant";
import { RhFormation } from "../models/RhFormation";
import { RhRemboursementPret } from "../models/RhRemboursementPret";

export default class RhReportingController {
  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const totalEmployes = await RhEmploye.count();
      const actifs = await RhEmploye.count({ where: { statut: 'actif' } });
      const periodeOuvertes = await RhPeriodePaie.findAll({ where: { statut: 'ouverte' }, attributes: ['id'] });
      const periodeIds = periodeOuvertes.map((p: any) => p.id);
      const masseSalariale = periodeIds.length > 0 ? await RhBulletinPaie.sum('totalGains', { where: { periodeId: periodeIds } as any }) || 0 : 0;
      const parDepartement = await RhEmploye.findAll({
        attributes: ['departementId', [fn('COUNT', col('id')), 'count']],
        include: [{ model: RhDepartement, as: 'departement', attributes: ['nom'] }],
        group: ['departementId']
      });
      const pretsActifs = await RhPret.count({ where: { statut: 'actif' } });
      const totalPrets = await RhPret.sum('soldeRestant', { where: { statut: 'actif' } }) || 0;
      const heuresMois = await RhHeureSupplementaire.sum('nombreHeures', {
        where: { statut: { [Op.ne]: 'payee' } }
      }) || 0;
      return res.status(200).json({
        totalEmployes, actifs, masseSalariale,
        repartitionDepartement: parDepartement,
        pretsActifs, totalPrets, heuresSupplementairesEnCours: heuresMois
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getMasseSalariale(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhBulletinPaie.findAll({
        attributes: [
          'periodeId',
          [fn('SUM', col('totalGains')), 'totalGains'],
          [fn('SUM', col('totalRetenues')), 'totalRetenues'],
          [fn('SUM', col('netAPayer')), 'netAPayer']
        ],
        include: [{ model: RhPeriodePaie, as: 'periode', attributes: ['mois', 'annee'] }],
        group: ['periodeId'],
        order: [[literal('periode.annee'), 'DESC'], [literal('periode.mois'), 'DESC']]
      });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getEffectifs(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhEmploye.findAll({
        attributes: ['posteId', [fn('COUNT', col('id')), 'count']],
        include: [{ model: RhPoste, as: 'poste', attributes: ['titre'] }],
        where: { statut: 'actif' },
        group: ['posteId']
      });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getSituationPrets(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findAll({
        include: [
          { model: RhEmploye, as: 'employe' },
          { model: RhRemboursementPret, as: 'remboursements' }
        ]
      });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

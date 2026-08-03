import { Request, Response } from "express";
import { Op } from "sequelize";
import { PaiementInscription } from "../../inscription/models/PaiementInscription";
import { FactureProforma } from "../../achats/models/FactureProforma";

export default class RapportPaiementsController {

  static async getPaiements(req: Request, res: Response): Promise<Response> {
    try {
      const { dateDebut, dateFin, modePaiement } = req.query;
      const where: any = {};
      if (dateDebut && dateFin) {
        where.datePaiement = { [Op.between]: [dateDebut, dateFin] };
      }
      if (modePaiement) where.type = modePaiement;

      const data = await PaiementInscription.findAll({
        where,
        attributes: ['datePaiement', 'type', 'montant'],
        order: [['datePaiement', 'ASC']]
      });

      return res.status(200).send(data.map((item: any) => ({
        date: item.datePaiement ? item.datePaiement.toISOString().slice(0, 10) : null,
        modePaiement: item.type || 'inconnu',
        montantTotal: Number(item.montant) || 0
      })));
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getFactures(req: Request, res: Response): Promise<Response> {
    try {
      const { mois, statut } = req.query;
      const where: any = {};
      if (mois) where.createdAt = { [Op.like]: `${mois}%` };
      if (statut) where.statut = statut;

      const data = await FactureProforma.findAll({
        where,
        attributes: ['createdAt', 'statut', 'montantTotal'],
        order: [['createdAt', 'ASC']]
      });

      const groupes = new Map<string, { mois: string; nbFactures: number; montantTotal: number; statut: string | null }>();
      for (const item of data as any[]) {
        const key = item.createdAt ? item.createdAt.toISOString().slice(0, 7) : 'N/A';
        const current = groupes.get(key) || { mois: key, nbFactures: 0, montantTotal: 0, statut: item.statut || null };
        current.nbFactures += 1;
        current.montantTotal += Number(item.montantTotal) || 0;
        groupes.set(key, current);
      }

      return res.status(200).send(Array.from(groupes.values()).sort((a, b) => a.mois.localeCompare(b.mois)));
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getTotaux(req: Request, res: Response): Promise<Response> {
    try {
      const totalMontant = await PaiementInscription.sum('montant');
      const totalTransactions = await PaiementInscription.count();
      return res.status(200).json({ totalMontant: Number(totalMontant) || 0, totalTransactions });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}

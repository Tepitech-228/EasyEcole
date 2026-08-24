import { Request, Response } from "express";
import { Op } from "sequelize";
import { ClotureCaisse } from "../models/ClotureCaisse";
import { JournalCaisse } from "../models/JournalCaisse";
import { RecuCaisse } from "../models/RecuCaisse";
import { DemandeDocument } from "../models/DemandeDocument";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

export default class ClotureCaisseController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const clotures = await ClotureCaisse.findAll({
        include: [{ association: ClotureCaisse.associations.caissier }],
        order: [['dateCloture', 'DESC']]
      });
      return res.status(200).json(clotures);
    } catch (error) {
      console.error('[SECRETARIAT][ClotureCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async ouvrir(req: Request, res: Response): Promise<Response> {
    try {
      const utilisateurId = (req as any).utilisateurId;
      const cloture = await ClotureCaisse.create({
        dateCloture: new Date(),
        caissierId: utilisateurId,
        montantTheorique: 0,
        montantReel: 0,
        ecart: 0,
        statut: 'ouverte'
      });
      return res.status(201).json(cloture);
    } catch (error) {
      console.error('[SECRETARIAT][ClotureCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async cloturer(req: Request, res: Response): Promise<Response> {
    const utilisateurId = (req as any).utilisateurId;
    const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
    try {
      const cloture = await ClotureCaisse.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!cloture) {
        await transaction.rollback();
        return res.status(404).json({ success: false, code: 'CLOTURE_NOT_FOUND', message: "Clôture non trouvée" });
      }

      if (cloture.statut === 'cloturee') {
        await transaction.rollback();
        return res.status(409).json({ success: false, code: 'CLOTURE_ALREADY_CLOSED', message: "Clôture déjà fermée" });
      }

      // Montant théorique = somme des reçus encaissés par ce caissier depuis l'ouverture.
      // Sans ce calcul, l'écart annoncé serait toujours faux (faux succès métier).
      const recusPeriode = await RecuCaisse.findAll({
        where: { caissierId: cloture.caissierId, createdAt: { [Op.gte]: new Date(cloture.dateCloture) } },
        transaction
      });
      const montantTheorique = recusPeriode.reduce((somme, r) => somme + (Number(r.montant) || 0), 0);

      // Rattacher les lignes de journal de la période à cette clôture
      // (sinon elles seraient comptées deux fois lors de la clôture suivante).
      const recusIds = recusPeriode.map(r => r.id);
      if (recusIds.length > 0) {
        await JournalCaisse.update(
          { clotureId: cloture.id },
          { where: { clotureId: null, recuId: { [Op.in]: recusIds } }, transaction }
        );
      }

      const montantReel = Number(req.body.montantReel || 0);
      if (!Number.isFinite(montantReel) || montantReel < 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, code: 'MONTANT_INVALIDE', message: "montantReel doit être un nombre positif" });
      }
      const ecart = montantReel - montantTheorique;

      await cloture.update({
        montantTheorique,
        montantReel,
        ecart,
        statut: 'cloturee'
      }, { transaction });

      await transaction.commit();
      return res.status(200).json(cloture);
    } catch (error) {
      await transaction.rollback().catch(rbErr => console.error('[SECRETARIAT][cloturer] rollback échoué:', rbErr));
      console.error(`[SECRETARIAT][cloturer] user=${utilisateurId} cloture=${req.params.id}`, error);
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: "Erreur lors de la clôture de caisse" });
    }
  }

  static async getJournal(req: Request, res: Response): Promise<Response> {
    try {
      const clotureId = req.params.id;
      const lignes = await JournalCaisse.findAll({
        where: { clotureId: Number(clotureId) },
        include: [
          { association: JournalCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }] }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).json(lignes);
    } catch (error) {
      console.error('[SECRETARIAT][ClotureCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }
}

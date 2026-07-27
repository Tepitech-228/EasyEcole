import { Request, Response } from "express";
import { Op } from "sequelize";
import { EcritureComptable } from "../models/EcritureComptable";
import { LigneReleveBancaire } from "../models/LigneReleveBancaire";
import { ReleveBancaire } from "../models/ReleveBancaire";
import { Compte } from "../models/Compte";

export default class RapprochementController {
  static async getNonRapprochees(req: Request, res: Response): Promise<Response> {
    try {
      const compteBancaireId = req.query.compteBancaireId as string;
      const compteBanque = await Compte.findOne({ where: { numero: '512' } });

      const ecritures = await EcritureComptable.findAll({
        where: {
          validee: true,
          ...(compteBanque ? { [Op.or]: [{ compteDebitId: compteBanque.id }, { compteCreditId: compteBanque.id }] } : {}),
          lettre: { [Op.is]: null }
        },
        include: [
          { model: Compte, as: 'compteDebit' },
          { model: Compte, as: 'compteCredit' }
        ],
        order: [['dateEcriture', 'ASC']]
      });

      const lignesReleveWhere: any = { rapprochee: false };
      if (compteBancaireId) {
        const releves = await ReleveBancaire.findAll({ where: { compteBancaireId }, attributes: ['id'] });
        lignesReleveWhere.releveBancaireId = { [Op.in]: releves.map(r => r.id) };
      }
      const lignesReleve = await LigneReleveBancaire.findAll({
        where: lignesReleveWhere,
        include: [{ model: ReleveBancaire, as: 'releveBancaire' }],
        order: [['dateOperation', 'ASC']]
      });

      return res.status(200).json({ success: true, ecritures, lignesReleve });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async rapprocher(req: Request, res: Response): Promise<Response> {
    try {
      const { ecritureComptableId, ligneReleveId } = req.body;
      if (!ecritureComptableId || !ligneReleveId) {
        return res.status(400).json({ success: false, message: "ecritureComptableId et ligneReleveId requis" });
      }

      const ecriture = await EcritureComptable.findByPk(ecritureComptableId);
      if (!ecriture) return res.status(404).json({ success: false, message: "Écriture comptable non trouvée" });

      const ligne = await LigneReleveBancaire.findByPk(ligneReleveId);
      if (!ligne) return res.status(404).json({ success: false, message: "Ligne de relevé non trouvée" });

      const dateRapprochement = new Date();
      await ecriture.update({ lettre: `R${ligneReleveId}`, dateLettrage: dateRapprochement });
      await ligne.update({ rapprochee: true, ecritureComptableId, dateRapprochement });

      const releve = await ReleveBancaire.findByPk(ligne.releveBancaireId);
      if (releve) {
        const nonRapprochees = await LigneReleveBancaire.count({ where: { releveBancaireId: releve.id, rapprochee: false } });
        if (nonRapprochees === 0) await releve.update({ statut: 'rapproche' });
        else if (releve.statut === 'importe') await releve.update({ statut: 'verifie' });
      }

      return res.status(200).json({ success: true, message: "Rapprochement effectué" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async defaireRapprochement(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const ligne = await LigneReleveBancaire.findByPk(id);
      if (!ligne) return res.status(404).json({ success: false, message: "Ligne de relevé non trouvée" });

      if (ligne.ecritureComptableId) {
        await EcritureComptable.update(
          { lettre: null, dateLettrage: null },
          { where: { id: ligne.ecritureComptableId } }
        );
      }
      await ligne.update({ rapprochee: false, ecritureComptableId: null, dateRapprochement: null });

      return res.status(200).json({ success: true, message: "Rapprochement annulé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async lettrer(req: Request, res: Response): Promise<Response> {
    try {
      const { ecritureIds, lettre } = req.body;
      if (!ecritureIds || !Array.isArray(ecritureIds) || ecritureIds.length < 2) {
        return res.status(400).json({ success: false, message: "Au moins 2 écritures requises pour le lettrage" });
      }
      await EcritureComptable.update(
        { lettre, dateLettrage: new Date() },
        { where: { id: { [Op.in]: ecritureIds } } }
      );
      return res.status(200).json({ success: true, message: `Lettrage ${lettre} effectué sur ${ecritureIds.length} écritures` });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getSituationCompte(req: Request, res: Response): Promise<Response> {
    try {
      const compteId = req.params.compteId;
      const ecritures = await EcritureComptable.findAll({
        where: {
          [Op.or]: [{ compteDebitId: compteId }, { compteCreditId: compteId }]
        },
        include: [
          { model: Compte, as: 'compteDebit' },
          { model: Compte, as: 'compteCredit' }
        ],
        order: [['dateEcriture', 'ASC']]
      });

      let solde = 0;
      const lignes = ecritures.map(e => {
        const estDebit = Number(e.compteDebitId) === Number(compteId);
        const mouvement = estDebit ? Number(e.montant) : -Number(e.montant);
        solde += mouvement;
        return {
          id: e.id,
          date: e.dateEcriture,
          libelle: e.libelle,
          reference: e.reference,
          debit: estDebit ? e.montant : 0,
          credit: estDebit ? 0 : e.montant,
          lettre: e.lettre,
          solde
        };
      });

      return res.status(200).json({ success: true, compteId, solde, lignes });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

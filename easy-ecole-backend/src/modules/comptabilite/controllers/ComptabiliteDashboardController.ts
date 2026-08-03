import { Request, Response } from "express";
import { Compte } from "../models/Compte";
import { CompteBancaire } from "../models/CompteBancaire";
import { EcritureComptable } from "../models/EcritureComptable";
import { ExerciceComptable } from "../models/ExerciceComptable";
import { getSoldeCompteAtDate } from "../helpers/ComptabiliteHelper";

export default class ComptabiliteDashboardController {
  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const [totalComptes, totalEcritures, totalExercices, totalComptesBancaires, exerciceActif, comptes, dernieresEcritures] = await Promise.all([
        Compte.count(),
        EcritureComptable.count(),
        ExerciceComptable.count(),
        CompteBancaire.count(),
        ExerciceComptable.findOne({ where: { actif: true } }),
        Compte.findAll({ attributes: ['id', 'classe', 'nature'] }),
        EcritureComptable.findAll({
          order: [['dateEcriture', 'DESC']],
          limit: 5,
          attributes: ['id', 'numeroEcriture', 'libelle', 'dateEcriture', 'montant', 'validee']
        })
      ]);

      // Même pattern que EtatsFinanciersController / ComptabiliteHelper :
      // le solde de chaque compte est calculé à partir des écritures comptables validées
      // (débit = +, crédit = -) à la date du jour, et non stocké sur le modèle Compte.
      const date = new Date().toISOString().split('T')[0];

      let totalActif = 0;
      let totalPassif = 0;
      let totalProduits = 0;
      let totalCharges = 0;

      for (const compte of comptes) {
        const solde = await getSoldeCompteAtDate(compte.id, date);
        if (solde === 0) continue;

        const classe = compte.classe;
        const isDebiteur = solde > 0;

        // Règle OHADA (identique au bilan EtatsFinanciersController) :
        // ACTIF : classe 2 (immobilisations), 3 (stocks), 5 débiteur (trésorerie),
        //         classe 4 nature Débit (créances)
        // PASSIF : classe 1 (capitaux propres), 4 nature Crédit (dettes),
        //          classe 5 créditeur (découvert)
        if (classe === '2' || classe === '3') {
          totalActif += Math.abs(solde);
        } else if (classe === '5') {
          if (isDebiteur) totalActif += Math.abs(solde);
          else totalPassif += Math.abs(solde);
        } else if (classe === '4') {
          if (compte.nature === 'Débit' || compte.nature === 'Débit/Crédit') totalActif += Math.abs(solde);
          else totalPassif += Math.abs(solde);
        } else if (classe === '1') {
          totalPassif += Math.abs(solde);
        } else if (classe === '7') {
          totalProduits += Math.abs(solde);
        } else if (classe === '6') {
          totalCharges += Math.abs(solde);
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          totalComptes,
          totalEcritures,
          totalExercices,
          totalComptesBancaires,
          totalActif: Math.round(totalActif * 100) / 100,
          totalPassif: Math.round(totalPassif * 100) / 100,
          totalProduits: Math.round(totalProduits * 100) / 100,
          totalCharges: Math.round(totalCharges * 100) / 100,
          exerciceActif,
          dernieresEcritures
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}

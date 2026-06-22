import { Request, Response } from "express";
import { RhPeriodePaie } from "../models/RhPeriodePaie";
import { RhEmploye } from "../models/RhEmploye";
import { RhBulletinPaie } from "../models/RhBulletinPaie";
import { RhLigneBulletin } from "../models/RhLigneBulletin";
import { RhRubriquePaie } from "../models/RhRubriquePaie";

export default class RhPeriodePaieController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPeriodePaie.findAll({ order: [['annee', 'DESC'], ['mois', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPeriodePaie.findOne({ where: { id: req.params.id }, include: [{ association: RhPeriodePaie.associations.bulletinsPaie, include: [RhBulletinPaie.associations.employe] }] });
      if (!data) return res.status(404).json({ success: false, message: "Période de paie non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const existing = await RhPeriodePaie.findOne({ where: { mois: req.body.mois, annee: req.body.annee } });
      if (existing) return res.status(400).json({ success: false, message: "Cette période existe déjà" });
      const data = await RhPeriodePaie.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPeriodePaie.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Période de paie non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPeriodePaie.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Période de paie non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Période de paie supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async genererBulletins(req: Request, res: Response): Promise<Response> {
    try {
      const periode = await RhPeriodePaie.findByPk(req.params.id);
      if (!periode) return res.status(404).json({ success: false, message: "Période non trouvée" });
      if (periode.statut === 'verrouillée') return res.status(400).json({ success: false, message: "Période verrouillée" });

      const rubriques = await RhRubriquePaie.findAll();
      const employes = await RhEmploye.findAll({ where: { statut: 'actif' } });
      const bulletinsCrees: RhBulletinPaie[] = [];

      for (const employe of employes) {
        const bulletin = await RhBulletinPaie.create({
          employeId: employe.id,
          periodeId: periode.id,
          totalGains: 0,
          totalRetenues: 0,
          netAPayer: 0,
          statut: 'brouillon'
        });

        let totalGains = 0;
        let totalRetenues = 0;

        for (const rubrique of rubriques) {
          let montant = 0;
          let base = 0;

          if (rubrique.modeCalcul === 'fixe') {
            montant = Number(rubrique.valeur) || 0;
          } else if (rubrique.modeCalcul === 'pourcentage') {
            if (rubrique.code === 'SALAIRE_BASE') {
              base = Number(employe.salaireBase) || 0;
              montant = base;
            } else {
              base = Number(employe.salaireBase) || 0;
              montant = base * (Number(rubrique.valeur) || 0) / 100;
            }
          }

          if (montant > 0) {
            await RhLigneBulletin.create({
              bulletinId: bulletin.id,
              rubriqueId: rubrique.id,
              libelle: rubrique.libelle,
              base,
              taux: rubrique.modeCalcul === 'pourcentage' ? Number(rubrique.valeur) : 0,
              montant
            });

            if (rubrique.type === 'gain') totalGains += montant;
            else if (rubrique.type === 'retenue' || rubrique.type === 'cotisation') totalRetenues += montant;
          }
        }

        const netAPayer = totalGains - totalRetenues;
        await bulletin.update({ totalGains, totalRetenues, netAPayer });
        bulletinsCrees.push(bulletin);
      }

      return res.status(200).json({ success: true, message: `${bulletinsCrees.length} bulletins générés`, count: bulletinsCrees.length });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

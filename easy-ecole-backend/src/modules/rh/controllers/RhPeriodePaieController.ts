import { Request, Response } from "express";
import { RhPeriodePaie } from "../models/RhPeriodePaie";
import { RhBulletinPaie } from "../models/RhBulletinPaie";
import { RhPaieService } from "../services/RhPaieService";

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

      // Génération idempotente et transactionnelle via RhPaieService.
      const count = await RhPaieService.genererBulletinsPourPeriode(periode);

      return res.status(200).json({ success: true, message: `${count} bulletins générés`, count });
    } catch (error: any) {
      if (error?.message?.includes('régénération refusée')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, error });
    }
  }
}

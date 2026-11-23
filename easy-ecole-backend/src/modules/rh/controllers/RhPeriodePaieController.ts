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
      const population = req.query.population;
      if (population !== undefined && population !== "personnel" && population !== "enseignants") {
        return res.status(400).json({ success: false, message: "La population doit être 'personnel' ou 'enseignants'." });
      }
      const count = await RhPaieService.genererBulletinsPourPeriode(periode, population as "personnel" | "enseignants" | undefined);

      return res.status(200).json({ success: true, message: `${count} bulletins générés`, count });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur inattendue pendant la génération des bulletins.";
      if (message.includes('régénération refusée')) {
        return res.status(409).json({ success: false, message });
      }
      if (message.startsWith("Aucun taux") || message.startsWith("Le taux") || message.startsWith("L’employé") || message.startsWith("Le pointage")) {
        return res.status(400).json({ success: false, message });
      }
      console.error("Erreur de génération des bulletins:", error);
      return res.status(500).json({ success: false, message });
    }
  }
}

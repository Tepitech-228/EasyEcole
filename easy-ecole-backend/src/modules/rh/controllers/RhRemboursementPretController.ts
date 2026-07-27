import { Request, Response } from "express";
import { RhRemboursementPret } from "../models/RhRemboursementPret";
import { RhPret } from "../models/RhPret";

export default class RhRemboursementPretController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByPret(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhRemboursementPret.findAll({
        where: { pretId: req.params.pretId }
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async effectuerRemboursement(req: Request, res: Response): Promise<Response> {
    try {
      const { pretId, montant } = req.body;
      const pret = await RhPret.findByPk(pretId);
      if (!pret) return res.status(404).json({ success: false, message: "Prêt non trouvé" });

      const nouveauSolde = Number(pret.soldeRestant) - Number(montant);
      const data = await RhRemboursementPret.create({
        ...req.body,
        soldeApres: nouveauSolde
      });

      await pret.update({
        soldeRestant: nouveauSolde,
        ...(nouveauSolde <= 0 ? { statut: 'rembourse' } : {})
      });

      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }
}

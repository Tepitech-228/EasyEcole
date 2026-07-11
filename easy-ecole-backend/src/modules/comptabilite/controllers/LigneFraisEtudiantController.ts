import { Request, Response } from "express";
import { LigneFraisEtudiant } from "../models/LigneFraisEtudiant";

export default class LigneFraisEtudiantController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne de frais non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne de frais non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Ligne de frais non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Ligne de frais supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByDossier(req: Request, res: Response): Promise<Response> {
    try {
      const data = await LigneFraisEtudiant.findAll({
        where: { dossierEtudiantId: req.params.dossierEtudiantId }
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

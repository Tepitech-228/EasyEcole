import { Request, Response } from "express";
import { RhHeureSupplementaire } from "../models/RhHeureSupplementaire";
import { RhEmploye } from "../models/RhEmploye";

export default class RhHeureSupplementaireController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Heure supplémentaire non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Heure supplémentaire non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Heure supplémentaire non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Heure supplémentaire supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByEmploye(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findAll({ where: { employeId: req.params.employeId } });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async valider(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhHeureSupplementaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Heure supplémentaire non trouvée" });

      const employe = await RhEmploye.findByPk(data.employeId);
      if (!employe) return res.status(404).json({ success: false, message: "Employé non trouvé" });

      const montant = (Number(employe.salaireBase) / 173) * Number(data.nombreHeures) * (1 + Number(data.tauxMajoration) / 100);

      await data.update({ statut: 'validee' });

      const result = { ...data.toJSON(), montant };
      result.montant = montant;

      return res.status(200).send(result);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

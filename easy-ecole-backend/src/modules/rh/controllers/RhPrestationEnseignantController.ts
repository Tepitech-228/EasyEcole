import { Request, Response } from "express";
import { RhPrestationEnseignant } from "../models/RhPrestationEnseignant";

export default class RhPrestationEnseignantController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findAll({ include: [RhPrestationEnseignant.associations.enseignant] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Prestation non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const montant = Number(req.body.nombreHeures) * Number(req.body.tauxHoraire);
      const data = await RhPrestationEnseignant.create({ ...req.body, montant });
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Prestation non trouvée" });
      const updates = { ...req.body };
      if (req.body.nombreHeures || req.body.tauxHoraire) {
        const nbHeures = Number(req.body.nombreHeures || data.nombreHeures);
        const taux = Number(req.body.tauxHoraire || data.tauxHoraire);
        updates.montant = nbHeures * taux;
      }
      await data.update(updates);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Prestation non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Prestation supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async valider(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Prestation non trouvée" });
      await data.update({ statut: 'validée' });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async payer(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPrestationEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Prestation non trouvée" });
      await data.update({ statut: 'payée' });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { RhContratEnseignant } from "../models/RhContratEnseignant";

export default class RhContratEnseignantController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findAll({
        include: [RhContratEnseignant.associations.employe]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findByPk(req.params.id, {
        include: [RhContratEnseignant.associations.employe]
      });
      if (!data) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Contrat supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByEmploye(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findAll({
        where: { employeId: req.params.employeId },
        order: [['dateDebut', 'DESC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async resilier(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await data.update({ statut: 'resilie', dateFin: new Date() });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async activer(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhContratEnseignant.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Contrat non trouvé" });
      await data.update({ statut: 'actif' });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { RhPret } from "../models/RhPret";
import { RhRemboursementPret } from "../models/RhRemboursementPret";

export default class RhPretController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByEmploye(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhPret.findAll({
        where: { employeId: req.params.employeId },
        include: [RhRemboursementPret]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async simuler(req: Request, res: Response): Promise<Response> {
    try {
      const { montant, nombreMois } = req.body;
      const mensualite = Number(montant) / Number(nombreMois);
      const echeancier = [];
      let soldeRestant = Number(montant);
      for (let mois = 1; mois <= Number(nombreMois); mois++) {
        echeancier.push({ mois, montant: mensualite, soldeRestant });
        soldeRestant -= mensualite;
        if (soldeRestant < 0) soldeRestant = 0;
      }
      return res.status(200).json({
        mensualite,
        totalRembourse: Number(montant),
        echeancier
      });
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }
}

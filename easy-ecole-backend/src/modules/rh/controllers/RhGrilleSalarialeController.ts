import { Request, Response } from "express";
import { RhGrilleSalariale } from "../models/RhGrilleSalariale";
import { Op } from "sequelize";

export default class RhGrilleSalarialeController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findAll();
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Grille salariale non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Grille salariale non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Grille salariale non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Grille salariale supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByPoste(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findAll({ where: { posteId: req.params.posteId } });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByCategorie(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhGrilleSalariale.findAll({ where: { categorieId: req.params.categorieId } });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async simuler(req: Request, res: Response): Promise<Response> {
    try {
      const { salaireBase, posteId, categorieId } = req.body;

      const conditions: any[] = [];
      if (posteId) conditions.push({ posteId });
      if (categorieId) conditions.push({ categorieId });

      const grille = await RhGrilleSalariale.findOne({
        where: { [Op.or]: conditions }
      });

      if (!grille) {
        return res.status(404).json({ success: false, message: "Aucune grille correspondante trouvée" });
      }

      const min = Number(grille.salaireMin);
      const max = Number(grille.salaireMax);
      const dansGrille = salaireBase >= min && salaireBase <= max;

      return res.status(200).json({ min, max, dansGrille });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

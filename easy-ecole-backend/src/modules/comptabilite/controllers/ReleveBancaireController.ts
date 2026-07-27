import { Request, Response } from "express";
import { ReleveBancaire } from "../models/ReleveBancaire";
import { LigneReleveBancaire } from "../models/LigneReleveBancaire";
import { CompteBancaire } from "../models/CompteBancaire";

export default class ReleveBancaireController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.compteBancaireId) where.compteBancaireId = req.query.compteBancaireId;
      const data = await ReleveBancaire.findAll({
        where, include: [{ model: LigneReleveBancaire, as: 'lignes' }, { model: CompteBancaire, as: 'compteBancaire' }],
        order: [['dateFin', 'DESC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReleveBancaire.findByPk(req.params.id, {
        include: [{ model: LigneReleveBancaire, as: 'lignes' }, { model: CompteBancaire, as: 'compteBancaire' }]
      });
      if (!data) return res.status(404).json({ success: false, message: "Relevé bancaire non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { lignes, ...releveData } = req.body;
      const data = await ReleveBancaire.create(releveData);
      if (lignes && lignes.length > 0) {
        await LigneReleveBancaire.bulkCreate(
          lignes.map((l: any) => ({ ...l, releveBancaireId: data.id }))
        );
      }
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReleveBancaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Relevé bancaire non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await ReleveBancaire.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Relevé bancaire non trouvé" });
      await LigneReleveBancaire.destroy({ where: { releveBancaireId: data.id } });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Relevé bancaire supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

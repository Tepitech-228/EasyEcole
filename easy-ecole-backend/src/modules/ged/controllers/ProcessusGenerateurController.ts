import { Request, Response } from "express";
import { ProcessusGenerateur } from "../models/ProcessusGenerateur";
import { Op } from "sequelize";

export default class ProcessusGenerateurController {

  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.actif !== 'false') where.isActif = true;
      if (req.query.moduleSource) where.moduleSource = String(req.query.moduleSource);

      const processus = await ProcessusGenerateur.findAll({
        where,
        order: [['libelle', 'ASC']]
      });

      return res.status(200).json(processus);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const processus = await ProcessusGenerateur.findByPk(req.params.id);
      if (!processus) {
        return res.status(404).json({ success: false, message: "Processus non trouvé" });
      }
      return res.status(200).json(processus);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const processus = await ProcessusGenerateur.create({
        code: req.body.code,
        libelle: req.body.libelle,
        description: req.body.description || null,
        moduleSource: req.body.moduleSource || null,
        isActif: req.body.isActif !== false
      });

      return res.status(201).json(processus);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const processus = await ProcessusGenerateur.findByPk(req.params.id);
      if (!processus) {
        return res.status(404).json({ success: false, message: "Processus non trouvé" });
      }

      if (req.body.code !== undefined) processus.code = req.body.code;
      if (req.body.libelle !== undefined) processus.libelle = req.body.libelle;
      if (req.body.description !== undefined) processus.description = req.body.description;
      if (req.body.moduleSource !== undefined) processus.moduleSource = req.body.moduleSource;
      if (req.body.isActif !== undefined) processus.isActif = req.body.isActif;

      await processus.save();

      return res.status(200).json(processus);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const processus = await ProcessusGenerateur.findByPk(req.params.id);
      if (!processus) {
        return res.status(404).json({ success: false, message: "Processus non trouvé" });
      }

      await processus.update({ isActif: false });

      return res.status(200).json({ success: true, message: "Processus désactivé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { FraisParcours } from "../models/FraisParcours";

export default class FraisParcoursController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.findAll({
        include: [
          FraisParcours.associations.parcours,
          FraisParcours.associations.niveauEtude,
          FraisParcours.associations.anneeAcademique
        ]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.findByPk(req.params.id, {
        include: [
          FraisParcours.associations.parcours,
          FraisParcours.associations.niveauEtude,
          FraisParcours.associations.anneeAcademique,
          { association: FraisParcours.associations.reductions },
          { association: FraisParcours.associations.penalites }
        ]
      });
      if (!data) return res.status(404).json({ success: false, message: "Frais non trouvés" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Frais non trouvés" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Frais non trouvés" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Frais supprimés" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getByParcours(req: Request, res: Response): Promise<Response> {
    try {
      const data = await FraisParcours.findAll({
        where: { parcoursId: req.params.parcoursId },
        include: [
          FraisParcours.associations.niveauEtude,
          FraisParcours.associations.anneeAcademique
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

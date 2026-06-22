import { Request, Response } from "express";
import { RhBulletinPaie } from "../models/RhBulletinPaie";
import { RhLigneBulletin } from "../models/RhLigneBulletin";

export default class RhBulletinPaieController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhBulletinPaie.findAll({ include: [RhBulletinPaie.associations.employe, RhBulletinPaie.associations.periode] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhBulletinPaie.findOne({ where: { id: req.params.id }, include: [RhBulletinPaie.associations.employe, RhBulletinPaie.associations.periode, { association: RhBulletinPaie.associations.lignesBulletin, include: [RhLigneBulletin.associations.rubrique] }] });
      if (!data) return res.status(404).json({ success: false, message: "Bulletin non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async valider(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhBulletinPaie.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Bulletin non trouvé" });
      await data.update({ statut: 'validé' });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async verser(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhBulletinPaie.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Bulletin non trouvé" });
      await data.update({ statut: 'versé' });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

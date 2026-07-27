import { Request, Response } from "express";
import { QuaAuditPiste } from "../models/QuaAuditPiste";

export default class QuaAuditPisteController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.auditId) where.auditId = req.query.auditId;
      const data = await QuaAuditPiste.findAll({ where, order: [['reference', 'ASC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAuditPiste.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Piste d'audit non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAuditPiste.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAuditPiste.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Piste d'audit non trouvée" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAuditPiste.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Piste d'audit non trouvée" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Piste d'audit supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

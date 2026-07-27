import { Request, Response } from "express";
import { QuaAudit } from "../models/QuaAudit";
import { QuaAuditPiste } from "../models/QuaAuditPiste";

export default class QuaAuditController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAudit.findAll({ include: [{ model: QuaAuditPiste, as: 'pistes' }], order: [['datePlanifiee', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAudit.findByPk(req.params.id, { include: [{ model: QuaAuditPiste, as: 'pistes' }] });
      if (!data) return res.status(404).json({ success: false, message: "Audit non trouvé" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAudit.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAudit.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Audit non trouvé" });
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await QuaAudit.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Audit non trouvé" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Audit supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await QuaAudit.count();
      return res.status(200).json({ success: true, count });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

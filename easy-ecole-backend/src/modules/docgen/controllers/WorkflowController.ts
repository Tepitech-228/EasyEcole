import { Request, Response } from "express";
import { DocGenWorkflow } from "../models/DocGenWorkflow";

export default class WorkflowController {
  static async getByType(req: Request, res: Response): Promise<Response> {
    try {
      const steps = await DocGenWorkflow.findAll({
        where: { typeId: req.params.typeId },
        order: [['ordre', 'ASC']]
      });
      return res.status(200).json(steps);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async save(req: Request, res: Response): Promise<Response> {
    try {
      const { typeId, steps } = req.body;
      if (!typeId || !steps) return res.status(400).json({ success: false, message: 'typeId et steps requis' });
      await DocGenWorkflow.destroy({ where: { typeId } });
      const created = await DocGenWorkflow.bulkCreate(
        steps.map((s: any) => ({ typeId, ordre: s.ordre, role: s.role, libelle: s.libelle, delaiHeures: s.delaiHeures }))
      );
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const step = await DocGenWorkflow.findByPk(req.params.id);
      if (!step) return res.status(404).json({ success: false, message: 'Étape non trouvée' });
      await step.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from "express";
import { DocGenTemplate } from "../models/DocGenTemplate";
import { DocGenType } from "../models/DocGenType";

export default class TemplateController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.typeId) where.typeId = Number(req.query.typeId);
      const templates = await DocGenTemplate.findAll({
        where,
        include: [{ association: 'type' }],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).json(templates);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const template = await DocGenTemplate.findByPk(req.params.id, {
        include: [{ association: 'type' }]
      });
      if (!template) return res.status(404).json({ success: false, message: 'Template non trouvé' });
      return res.status(200).json(template);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const lastVersion = await DocGenTemplate.findOne({
        where: { typeId: req.body.typeId },
        order: [['version', 'DESC']]
      });
      const template = await DocGenTemplate.create({
        ...req.body,
        version: lastVersion ? lastVersion.version + 1 : 1
      });
      return res.status(201).json(template);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const template = await DocGenTemplate.findByPk(req.params.id);
      if (!template) return res.status(404).json({ success: false, message: 'Template non trouvé' });
      await template.update({
        ...req.body,
        version: (template.version || 1) + 1
      });
      return res.status(200).json(template);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const template = await DocGenTemplate.findByPk(req.params.id);
      if (!template) return res.status(404).json({ success: false, message: 'Template non trouvé' });
      await template.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async preview(req: Request, res: Response): Promise<Response> {
    try {
      const { contenu, variables } = req.body;
      if (!contenu) return res.status(400).json({ success: false, message: 'contenu requis' });
      let rendered = contenu;
      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          rendered = rendered.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value ?? ''));
        }
      }
      return res.status(200).json({ rendered });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

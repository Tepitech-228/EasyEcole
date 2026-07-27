import { Request, Response } from 'express';
import DocumentType from '../models/DocumentType';
import Domain from '../models/Domain';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';

export default class DocumentTypeController {
  static async list(req: Request, res: Response) {
    try {
      const where: any = {};
      if (req.query.domainId) {
        where.domainId = req.query.domainId;
      }
      const types = await DocumentType.findAll({
        where,
        include: [{ model: Domain, as: 'domain' }],
        order: [['code', 'ASC']]
      });
      return res.status(200).json(types);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const type = await DocumentType.findByPk(req.params.id, {
        include: [{ model: Domain, as: 'domain' }]
      });
      if (!type) return res.status(404).json({ success: false, message: 'Type de document non trouvé' });
      return res.status(200).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'institution' });
    }
    try {
      const type = await DocumentType.create({
        domainId: req.body.domainId,
        code: req.body.code,
        shortCode: req.body.shortCode || null,
        label: req.body.label,
        defaultConfidentiality: req.body.defaultConfidentiality || 'interne',
        duaDurationYears: req.body.duaDurationYears || null,
        isPermanent: req.body.isPermanent || false
      });
      return res.status(201).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'institution' });
    }
    try {
      const type = await DocumentType.findByPk(req.params.id);
      if (!type) return res.status(404).json({ success: false, message: 'Type de document non trouvé' });
      type.domainId = req.body.domainId || type.domainId;
      type.code = req.body.code || type.code;
      type.shortCode = req.body.shortCode !== undefined ? req.body.shortCode : type.shortCode;
      type.label = req.body.label || type.label;
      type.defaultConfidentiality = req.body.defaultConfidentiality || type.defaultConfidentiality;
      type.duaDurationYears = req.body.duaDurationYears !== undefined ? req.body.duaDurationYears : type.duaDurationYears;
      type.isPermanent = req.body.isPermanent !== undefined ? req.body.isPermanent : type.isPermanent;
      await type.save();
      return res.status(200).json(type);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async remove(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const type = await DocumentType.findByPk(req.params.id);
      if (!type) return res.status(404).json({ success: false, message: 'Type de document non trouvé' });
      await type.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

import { Request, Response } from 'express';
import RolePermission from '../models/RolePermission';
import { ProcessusGenerateur } from '../models/ProcessusGenerateur';
import Domain from '../models/Domain';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';

const CONFIDENTIALITY_LEVELS = ['public', 'interne', 'restreint', 'confidentiel'];
const ALL_ROLES = ['apprenant', 'institution', 'admin', 'enseignant', 'ressources_humaines', 'caissier_banque', 'cabinet_comptable', 'comite_orientation'];

export default class RolePermissionController {
  static async list(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const { role, processusGenerateurId, domainId } = req.query;
      const where: any = {};
      if (role) where.role = role;
      if (processusGenerateurId) where.processusGenerateurId = processusGenerateurId;
      if (domainId) where.domainId = domainId;

      const permissions = await RolePermission.findAll({
        where,
        include: [
          { model: ProcessusGenerateur, as: 'processusGenerateur', attributes: ['id', 'code', 'libelle'], required: false },
          { model: Domain, as: 'domain', attributes: ['id', 'code', 'label'], required: false }
        ]
      });
      return res.status(200).json(permissions);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions doit être un tableau' });
      }

      await RolePermission.destroy({ where: {} });
      await RolePermission.bulkCreate(permissions.map((p: any) => ({
        confidentialityLevel: p.confidentialityLevel,
        role: p.role,
        canRead: p.canRead !== undefined ? p.canRead : true,
        canWrite: p.canWrite !== undefined ? p.canWrite : false,
        canDelete: p.canDelete !== undefined ? p.canDelete : false,
        canDownload: p.canDownload !== undefined ? p.canDownload : true,
        processusGenerateurId: p.processusGenerateurId || null,
        domainId: p.domainId || null
      })));

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getDefaults(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const grouped: Record<string, { role: string; canRead: boolean; canWrite: boolean; canDelete: boolean; canDownload: boolean }[]> = {};
      for (const level of CONFIDENTIALITY_LEVELS) {
        grouped[level] = [];
      }

      for (const role of ALL_ROLES) {
        if (role === 'apprenant') {
          grouped['public'].push({ role, canRead: true, canWrite: false, canDelete: false, canDownload: true });
          continue;
        }
        grouped['public'].push({ role, canRead: true, canWrite: false, canDelete: false, canDownload: true });
        grouped['interne'].push({ role, canRead: true, canWrite: false, canDelete: false, canDownload: true });
        if (role === 'institution' || role === 'admin') {
          grouped['restreint'].push({ role, canRead: true, canWrite: true, canDelete: false, canDownload: true });
        }
        if (role === 'admin') {
          grouped['confidentiel'].push({ role, canRead: true, canWrite: true, canDelete: true, canDownload: true });
        }
      }

      return res.status(200).json({
        defaults: grouped,
        description: 'Permissions par défaut basées sur les niveaux de confidentialité'
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async restoreDefaults(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      await RolePermission.destroy({ where: {} });

      const bulkData: any[] = [];
      for (const role of ALL_ROLES) {
        for (const level of CONFIDENTIALITY_LEVELS) {
          if (level === 'public') {
            bulkData.push({ confidentialityLevel: level, role, canRead: true, canWrite: false, canDelete: false, canDownload: true });
          } else if (role !== 'apprenant') {
            if (level === 'interne') {
              bulkData.push({ confidentialityLevel: level, role, canRead: true, canWrite: false, canDelete: false, canDownload: true });
            } else if (level === 'restreint' && (role === 'institution' || role === 'admin')) {
              bulkData.push({ confidentialityLevel: level, role, canRead: true, canWrite: true, canDelete: false, canDownload: true });
            } else if (level === 'confidentiel' && role === 'admin') {
              bulkData.push({ confidentialityLevel: level, role, canRead: true, canWrite: true, canDelete: true, canDownload: true });
            }
          }
        }
      }

      await RolePermission.bulkCreate(bulkData);
      return res.status(200).json({ success: true, message: 'Permissions par défaut restaurées', count: bulkData.length });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

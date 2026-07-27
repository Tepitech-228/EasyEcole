import { Op, Sequelize } from "sequelize";
import { DocumentGed } from "../models/DocumentGed";
import RolePermission from "../models/RolePermission";
import DocumentAccessGrant from "../models/DocumentAccessGrant";
import { Utilisateur } from "../../auth/models/Utilisateur";

type PermissionAction = 'read' | 'write' | 'delete' | 'download';

const ACTION_COLUMN_MAP: Record<PermissionAction, 'canRead' | 'canWrite' | 'canDelete' | 'canDownload'> = {
  read: 'canRead',
  write: 'canWrite',
  delete: 'canDelete',
  download: 'canDownload'
};

export class PermissionService {

  static async checkPermission(userId: string | number, action: PermissionAction, document: DocumentGed): Promise<boolean> {
    const col = ACTION_COLUMN_MAP[action];

    const level = document.confidentialityLevel || 'interne';

    if (level === 'public') return true;

    const role = await this.getUserRole(userId);

    const permission = await RolePermission.findOne({
      where: {
        confidentialityLevel: level,
        role,
        [Op.and]: [
          {
            [Op.or]: [
              { processusGenerateurId: document.processusGenerateurId },
              { processusGenerateurId: null }
            ]
          },
          {
            [Op.or]: [
              { domainId: document.domainId },
              { domainId: null }
            ]
          }
        ]
      }
    });

    if (permission && permission.getDataValue(col)) return true;

    if ((level === 'confidentiel' || level === 'restreint') && action === 'read') {
      const grant = await DocumentAccessGrant.findOne({
        where: {
          documentId: document.id,
          userId: userId,
          [Op.or]: [
            Sequelize.literal('expiresAt IS NULL'),
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });
      if (grant) return true;
    }

    if (level === 'restreint' && action === 'read' && document.uploaderId === Number(userId)) return true;

    return false;
  }

  static async getUserDocumentPermissions(userId: string | number, documentId: string | number): Promise<{ canRead: boolean; canWrite: boolean; canDelete: boolean; canDownload: boolean }> {
    const document = await DocumentGed.findByPk(documentId, {
      attributes: ['id', 'confidentialityLevel', 'uploaderId', 'processusGenerateurId', 'domainId']
    });

    if (!document) {
      return { canRead: false, canWrite: false, canDelete: false, canDownload: false };
    }

    const actions: PermissionAction[] = ['read', 'write', 'delete', 'download'];
    const results = await Promise.all(
      actions.map(a => this.checkPermission(userId, a, document))
    );

    return {
      canRead: results[0],
      canWrite: results[1],
      canDelete: results[2],
      canDownload: results[3]
    };
  }

  static async canAccessProcess(userId: string | number, processusGenerateurId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);

    const count = await RolePermission.count({
      where: {
        role,
        [Op.or]: [
          { processusGenerateurId },
          { processusGenerateurId: null }
        ],
        canRead: true
      }
    });

    return count > 0;
  }

  private static async getUserRole(userId: string | number): Promise<string> {
    const user = await Utilisateur.findByPk(userId, { attributes: ['role'], raw: true });
    return user?.role || 'apprenant';
  }
}

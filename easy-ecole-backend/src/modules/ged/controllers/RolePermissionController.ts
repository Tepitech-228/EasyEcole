import { Request, Response } from 'express';
import { Op } from 'sequelize';
import RolePermission from '../models/RolePermission';
import { ProcessusGenerateur } from '../models/ProcessusGenerateur';
import Domain from '../models/Domain';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';
import { DatabaseConnection } from '../../../core/helpers/DatabaseConnection';

const CONFIDENTIALITY_LEVELS = ['public', 'interne', 'restreint', 'confidentiel'];
const ALL_ROLES = ['apprenant', 'institution', 'admin', 'enseignant', 'ressources_humaines', 'caissier_banque', 'cabinet_comptable', 'comite_orientation'];

/**
 * Vérifie que l'utilisateur courant est administrateur.
 * Utilisé par toutes les méthodes de ce contrôleur.
 */
function isAdmin(req: Request): boolean {
  return (req as any).utilisateurRole === RolesUtilisateur.ADMIN;
}

/** Normalise les champs de scope (UUID processus / id domaine) : '' | 'null' | undefined => null */
function parseOptionalScope(value: any): any {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

/** Coercition booléenne robuste (vrai, 'true', 1, '1') avec valeur par défaut. */
function toBoolean(value: any, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return value === true || value === 'true' || value === 1 || value === '1';
}

/**
 * Construit le WHERE correspondant à l'index unique
 * idx_rp_conf_level_role_proc_dom (confidentialityLevel, role, processusGenerateurId, domainId).
 * IMPORTANT : en MySQL un index unique autorise plusieurs lignes NULL — on force donc
 * explicitement `IS NULL` pour retrouver les doublons au niveau applicatif.
 */
function buildUniqueWhere(data: {
  confidentialityLevel: string;
  role: string;
  processusGenerateurId: string | number | null;
  domainId: string | number | null;
}) {
  const where: any = {
    confidentialityLevel: data.confidentialityLevel,
    role: data.role
  };
  where.processusGenerateurId = data.processusGenerateurId == null ? { [Op.is]: null } : data.processusGenerateurId;
  where.domainId = data.domainId == null ? { [Op.is]: null } : data.domainId;
  return where;
}

/**
 * Alias de compatibilité front Angular :
 * le service ged.service.ts envoie processId/domaineId alors que le modèle
 * utilise processusGenerateurId/domainId. Les deux sont acceptés.
 */
function extractScopeFields(p: any) {
  return {
    processusGenerateurId: parseOptionalScope(p.processusGenerateurId ?? p.processId),
    domainId: parseOptionalScope(p.domainId ?? p.domaineId)
  };
}

export default class RolePermissionController {
  static async list(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const { role, processusGenerateurId, processId, domainId, domaineId } = req.query;
      const where: any = {};
      if (role) where.role = role;
      // Accepte les deux conventions de nommage (back : processusGenerateurId/domainId, front : processId/domaineId)
      const proc = processusGenerateurId ?? processId;
      const dom = domainId ?? domaineId;
      if (proc) where.processusGenerateurId = proc;
      if (dom) where.domainId = dom;

      const rows = await RolePermission.findAll({
        where,
        include: [
          { model: ProcessusGenerateur, as: 'processusGenerateur', attributes: ['id', 'code', 'libelle'], required: false },
          { model: Domain, as: 'domain', attributes: ['id', 'code', 'label'], required: false }
        ]
      });

      // Ajout additif d'alias attendus par le front (GedPermission.processId/domaineId/process/domaine)
      const permissions = rows.map((p) => {
        const plain: any = p.toJSON();
        return {
          ...plain,
          processId: plain.processusGenerateurId ?? null,
          domaineId: plain.domainId ?? null,
          process: plain.processusGenerateur ?? undefined,
          domaine: plain.domain ?? undefined
        };
      });
      return res.status(200).json(permissions);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * POST /permissions — crée une permission unitaire.
   * Retourne 409 si la combinaison (confidentialityLevel, role, processusGenerateurId, domainId)
   * existe déjà (index unique idx_rp_conf_level_role_proc_dom).
   */
  static async create(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const body = req.body ?? {};
      const role = typeof body.role === 'string' ? body.role.trim() : '';
      const confidentialityLevel = body.confidentialityLevel;

      if (!role) {
        return res.status(400).json({ success: false, message: 'Le champ role est requis' });
      }
      if (!CONFIDENTIALITY_LEVELS.includes(confidentialityLevel)) {
        return res.status(400).json({ success: false, message: `confidentialityLevel doit être l'une des valeurs : ${CONFIDENTIALITY_LEVELS.join(', ')}` });
      }

      const { processusGenerateurId, domainId } = extractScopeFields(body);

      // Pré-vérification du doublon (gère aussi les scopes NULL, cf. buildUniqueWhere)
      const existing = await RolePermission.findOne({
        where: buildUniqueWhere({ confidentialityLevel, role, processusGenerateurId, domainId }),
        paranoid: false
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Une permission existe déjà pour le niveau '${confidentialityLevel}', le rôle '${role}' et ce périmètre (processus/domaine)`
        });
      }

      const permission = await RolePermission.create({
        confidentialityLevel,
        role,
        canRead: toBoolean(body.canRead, true),
        canWrite: toBoolean(body.canWrite, false),
        canDelete: toBoolean(body.canDelete, false),
        canDownload: toBoolean(body.canDownload, true),
        processusGenerateurId,
        domainId
      });

      return res.status(201).json(permission);
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Une permission identique existe déjà pour ce niveau de confidentialité, ce rôle et ce périmètre' });
      }
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * PUT /permissions/:id — mise à jour partielle d'une permission unitaire.
   * Champs acceptés : role, confidentialityLevel, canRead, canWrite, canDelete, canDownload,
   * processusGenerateurId/processId, domainId/domaineId. Retourne 404 si l'id n'existe pas.
   */
  static async updateOne(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'id invalide' });
      }

      const permission = await RolePermission.findByPk(id);
      if (!permission) {
        return res.status(404).json({ success: false, message: 'Permission non trouvée' });
      }

      const body = req.body ?? {};
      const patch: any = {};

      if (body.role !== undefined) {
        const role = typeof body.role === 'string' ? body.role.trim() : '';
        if (!role) {
          return res.status(400).json({ success: false, message: 'role ne peut pas être vide' });
        }
        patch.role = role;
      }
      if (body.confidentialityLevel !== undefined) {
        if (!CONFIDENTIALITY_LEVELS.includes(body.confidentialityLevel)) {
          return res.status(400).json({ success: false, message: `confidentialityLevel doit être l'une des valeurs : ${CONFIDENTIALITY_LEVELS.join(', ')}` });
        }
        patch.confidentialityLevel = body.confidentialityLevel;
      }
      if (body.canRead !== undefined) patch.canRead = toBoolean(body.canRead, permission.canRead);
      if (body.canWrite !== undefined) patch.canWrite = toBoolean(body.canWrite, permission.canWrite);
      if (body.canDelete !== undefined) patch.canDelete = toBoolean(body.canDelete, permission.canDelete);
      if (body.canDownload !== undefined) patch.canDownload = toBoolean(body.canDownload, permission.canDownload);

      // Champs de scope : si la clé est présente (même à null/''), on l'applique
      if (body.processusGenerateurId !== undefined || body.processId !== undefined) {
        patch.processusGenerateurId = parseOptionalScope(body.processusGenerateurId ?? body.processId);
      }
      if (body.domainId !== undefined || body.domaineId !== undefined) {
        patch.domainId = parseOptionalScope(body.domainId ?? body.domaineId);
      }

      // Vérification du doublon sur l'index unique (hors permission courante)
      if (patch.confidentialityLevel !== undefined || patch.role !== undefined ||
          patch.processusGenerateurId !== undefined || patch.domainId !== undefined) {
        const merged = {
          confidentialityLevel: patch.confidentialityLevel ?? permission.confidentialityLevel,
          role: patch.role ?? permission.role,
          processusGenerateurId: patch.processusGenerateurId !== undefined ? patch.processusGenerateurId : permission.processusGenerateurId,
          domainId: patch.domainId !== undefined ? patch.domainId : permission.domainId
        };
        const duplicateWhere = buildUniqueWhere(merged);
        duplicateWhere.id = { [Op.ne]: id };
        const duplicate = await RolePermission.findOne({ where: duplicateWhere, paranoid: false });
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'Une permission identique existe déjà pour ce niveau de confidentialité, ce rôle et ce périmètre' });
        }
      }

      await permission.update(patch);
      return res.status(200).json(permission);
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Une permission identique existe déjà pour ce niveau de confidentialité, ce rôle et ce périmètre' });
      }
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * DELETE /permissions/:id — supprime définitivement une permission unitaire.
   * Suppression en dur (force: true) pour libérer le slot de l'index unique
   * (sinon une ligne soft-deleted bloquerait la recréation de la même combinaison).
   */
  static async remove(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'id invalide' });
      }

      const permission = await RolePermission.findByPk(id);
      if (!permission) {
        return res.status(404).json({ success: false, message: 'Permission non trouvée' });
      }

      await RolePermission.destroy({ where: { id }, force: true });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * PUT /permissions — remplacement destructif en masse.
   * CORRIGÉ : destroy + bulkCreate sont désormais enveloppés dans une transaction
   * (plus aucune perte de données si le bulkCreate échoue à mi-parcours).
   * La suppression est en dur (force: true) pour libérer l'index unique.
   */
  static async update(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      // Accepte les deux formats envoyés par le front :
      //   1) tableau brut : [ { ... }, { ... } ]
      //   2) objet enveloppe : { permissions: [ { ... }, { ... } ] }
      // (le service Angular ged.service.ts envoie désormais un tableau brut)
      const rawBody: any = req.body ?? {};
      const permissions = Array.isArray(rawBody) ? rawBody : rawBody.permissions;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions doit être un tableau' });
      }

      // Validation de chaque entrée avant tout accès en écriture
      for (const p of permissions) {
        if (!p || typeof p !== 'object') {
          return res.status(400).json({ success: false, message: 'Chaque permission doit être un objet' });
        }
        const role = typeof p.role === 'string' ? p.role.trim() : '';
        if (!role) {
          return res.status(400).json({ success: false, message: 'Le champ role est requis pour chaque permission' });
        }
        if (!CONFIDENTIALITY_LEVELS.includes(p.confidentialityLevel)) {
          return res.status(400).json({ success: false, message: `confidentialityLevel doit être l'une des valeurs : ${CONFIDENTIALITY_LEVELS.join(', ')}` });
        }
      }

      const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
      try {
        await RolePermission.destroy({ where: {}, force: true, transaction });
        await RolePermission.bulkCreate(permissions.map((p: any) => {
          const scope = extractScopeFields(p);
          return {
            confidentialityLevel: p.confidentialityLevel,
            role: typeof p.role === 'string' ? p.role.trim() : p.role,
            canRead: toBoolean(p.canRead, true),
            canWrite: toBoolean(p.canWrite, false),
            canDelete: toBoolean(p.canDelete, false),
            canDownload: toBoolean(p.canDownload, true),
            processusGenerateurId: scope.processusGenerateurId,
            domainId: scope.domainId
          };
        }), { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getDefaults(req: Request, res: Response) {
    if (!isAdmin(req)) {
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

  /**
   * POST /permissions/defaults — restaure les permissions par défaut.
   * CORRIGÉ : idem update, suppression en dur + transaction pour éviter toute
   * perte de données et tout conflit d'index unique (bug latent identique).
   */
  static async restoreDefaults(req: Request, res: Response) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
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

      const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
      try {
        await RolePermission.destroy({ where: {}, force: true, transaction });
        await RolePermission.bulkCreate(bulkData, { transaction });
        await transaction.commit();
        return res.status(200).json({ success: true, message: 'Permissions par défaut restaurées', count: bulkData.length });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}

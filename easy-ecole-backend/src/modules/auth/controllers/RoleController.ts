import { Request, Response } from "express";
import { Role } from "../models/Role";
import { RoleMenuGrant } from "../models/RoleMenuGrant";
import { RolePermission } from "../models/RolePermission";
import { Permission } from "../models/Permission";
import { UserRole } from "../models/UserRole";
import { UserPermission } from "../models/UserPermission";
import { Utilisateur } from "../models/Utilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MENU_CONFIG } from "../../menu/menu.config";

/**
 * Clés de menu réellement accordables à un profil via l'écran « Pôles & menus ».
 * Les entrées roleRestricted restent réservées au rôle : un grant ne doit pas
 * contourner cette barrière de sécurité.
 */
function clesMenuAccordables(): Set<string> {
    const cles = new Set<string>();
    for (const pole of MENU_CONFIG) {
        for (const group of pole.groups) {
            if (group.roleRestricted) continue;
            for (const item of group.items) {
                if (item.permissionKey && !item.roleRestricted) {
                    cles.add(item.permissionKey);
                }
            }
        }
    }
    return cles;
}

export default class RoleController {

    static async getAllRoles(req: Request, res: Response): Promise<Response> {
        try {
            const roles = await Role.findAll({ order: [['nom', 'ASC']] });
            return res.status(200).send(roles);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getRole(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }
            return res.status(200).send(role);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async createRole(req: Request, res: Response): Promise<Response> {
        try {
            const nom = typeof req.body?.nom === 'string' ? req.body.nom.trim() : '';
            const description = typeof req.body?.description === 'string' && req.body.description.trim()
                ? req.body.description.trim()
                : null;
            if (!nom) {
                return res.status(400).json({ success: false, message: "Le nom est requis" });
            }

            // Un profil supprimé reste en base (paranoid) et son nom reste
            // bloqué par l'index UNIQUE. On le restaure au lieu de renvoyer une
            // fausse erreur « ce nom existe déjà ».
            const existant = await Role.findOne({ where: { nom }, paranoid: false });
            if (existant) {
                if (!(existant as any).deletedAt) {
                    return res.status(400).json({ success: false, message: "Ce nom de rôle existe déjà" });
                }
                await existant.restore();
                await existant.update({ description });
                return res.status(201).send(existant);
            }

            const role = await Role.create({ nom, description });
            return res.status(201).send(role);
        } catch (error: any) {
            if (error?.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: "Ce nom de rôle existe déjà" });
            }
            return res.status(500).json({ success: false, error });
        }
    }

    static async updateRole(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { nom, description } = req.body;
            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }
            await role.update({ nom, description });
            return res.status(200).send(role);
        } catch (error: any) {
            if (error?.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: "Ce nom de rôle existe déjà" });
            }
            return res.status(500).json({ success: false, error });
        }
    }

    static async deleteRole(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }
            await RolePermission.destroy({ where: { roleId: id } });
            await RoleMenuGrant.destroy({ where: { roleId: id }, force: true });
            await UserRole.destroy({ where: { roleId: id } });
            await role.destroy();
            return res.status(200).json({ success: true, message: "Rôle supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getRolePermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const rolePermissions = await RolePermission.findAll({
                where: { roleId: id },
                include: [{ model: Permission, as: 'permission' }]
            });
            return res.status(200).send(rolePermissions);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async updateRolePermissions(req: Request, res: Response): Promise<Response> {
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const { id } = req.params;
            const { permissionIds, confirmClear } = req.body;

            const role = await Role.findByPk(id, { transaction });
            if (!role) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }

            const ids = Array.isArray(permissionIds)
                ? [...new Set(permissionIds.map(Number).filter((permissionId: number) => Number.isInteger(permissionId) && permissionId > 0))]
                : [];
            const permissions = ids.length > 0
                ? await Permission.findAll({ where: { id: ids }, attributes: ['id'], transaction })
                : [];
            if (permissions.length !== ids.length) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Une ou plusieurs permissions sont inconnues" });
            }

            // Garde anti-vidage : une liste vide (absente, non tableaux, ou uniquement
            // des valeurs invalides) ne doit pas effacer silencieusement les permissions
            // existantes d'un rôle sans confirmation explicite du client.
            if (ids.length === 0 && confirmClear !== true) {
                const currentCount = await RolePermission.count({ where: { roleId: id }, transaction });
                if (currentCount > 0) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Le rôle possède actuellement ${currentCount} permission(s). Une liste vide est refusée pour éviter une perte accidentelle : renvoyez confirmClear: true pour vider volontairement le rôle.`
                    });
                }
            }

            await RolePermission.destroy({ where: { roleId: id }, force: true, transaction });

            if (ids.length > 0) {
                const newPermissions = ids.map((permissionId: number) => ({
                    roleId: Number(id) as any,
                    permissionId: permissionId as any
                }));
                await RolePermission.bulkCreate(newPermissions, { transaction });
            }

            await transaction.commit();
            return res.status(200).json({ success: true, message: "Permissions du rôle mises à jour" });
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error });
        }
    }

    static async getRoleMenuGrants(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }

            const grants = await RoleMenuGrant.findAll({
                where: { roleId: id },
                attributes: ['permissionKey']
            });
            const rolePermissions = await RolePermission.findAll({
                where: { roleId: id },
                include: [{ model: Permission, as: 'permission', attributes: ['key'] }]
            });

            return res.status(200).json({
                success: true,
                roleId: Number(id),
                grantedKeys: grants.map(grant => grant.permissionKey),
                rolePermissionKeys: rolePermissions
                    .map(rp => (rp as any).permission?.key)
                    .filter((key: string | undefined): key is string => !!key && key.startsWith('menu.'))
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    /**
     * Remplace les grants additifs d'un profil. Le rôle conserve ses
     * RolePermission intacts : retirer un pôle ne révoque que le grant.
     */
    static async updateRoleMenuGrants(req: Request, res: Response): Promise<Response> {
        const { permissionKeys } = req.body ?? {};
        if (!Array.isArray(permissionKeys)) {
            return res.status(400).json({ success: false, message: "Le champ 'permissionKeys' doit être un tableau" });
        }

        const accordables = clesMenuAccordables();
        const clesDemandees = [...new Set(
            permissionKeys
                .filter((key: unknown): key is string => typeof key === 'string')
                .map(key => key.trim())
                .filter(Boolean)
        )];
        const inconnues = clesDemandees.filter(key => !accordables.has(key));
        if (inconnues.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Clé(s) de menu non accordable(s) : ${inconnues.join(', ')}`
            });
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id, { transaction });
            if (!role) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }

            const existants = await RoleMenuGrant.findAll({
                where: { roleId: id },
                paranoid: false,
                transaction
            });
            const desired = new Set(clesDemandees);
            const existingByKey = new Map(existants.map(grant => [grant.permissionKey, grant]));

            for (const grant of existants) {
                if (!desired.has(grant.permissionKey)) {
                    if (!(grant as any).deletedAt) {
                        await grant.destroy({ transaction });
                    }
                    continue;
                }
                if ((grant as any).deletedAt) {
                    await grant.restore({ transaction });
                }
            }

            for (const key of clesDemandees) {
                if (!existingByKey.has(key)) {
                    await RoleMenuGrant.create({ roleId: Number(id), permissionKey: key } as any, { transaction });
                }
            }

            await transaction.commit();
            return res.status(200).json({
                success: true,
                message: "Pôles et menus du profil mis à jour",
                grantedKeys: clesDemandees
            });
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error });
        }
    }

    static async getRoleUtilisateurs(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const userRoles = await UserRole.findAll({
                where: { roleId: id },
                include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenoms', 'email'] }]
            });
            return res.status(200).send(userRoles);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async assignRoleToUser(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { utilisateurId } = req.body;

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }

            const utilisateur = await Utilisateur.findByPk(utilisateurId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            const lienExistant = await UserRole.findOne({
                where: { utilisateurId, roleId: id },
                paranoid: false,
            });
            if (lienExistant) {
                if ((lienExistant as any).deletedAt) await lienExistant.restore();
            } else {
                await UserRole.create({ utilisateurId, roleId: id });
            }

            return res.status(200).json({ success: true, message: "Rôle assigné à l'utilisateur" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async removeRoleFromUser(req: Request, res: Response): Promise<Response> {
        try {
            const { id, utilisateurId } = req.params;

            // 1. Récupérer les permissions du rôle avant suppression
            const rolePermissions = await RolePermission.findAll({ where: { roleId: id } });
            const rolePermIds = rolePermissions.map(rp => Number(rp.permissionId));

            // 2. Supprimer le lien rôle↔utilisateur
            await UserRole.destroy({
                where: { utilisateurId, roleId: id }
            });

            // 3. Révoquer les permissions qui venaient de ce rôle
            //    (uniquement si l'utilisateur n'a PAS d'autre rôle qui donne la même permission)
            const otherRoles = await UserRole.findAll({ where: { utilisateurId, roleId: { [require('sequelize').Op.ne]: id } } });
            const otherRoleIds = otherRoles.map(ur => Number(ur.roleId));

            if (otherRoleIds.length > 0) {
                // Vérifier quelles permissions sont encore couvertes par un autre rôle
                const otherPerms = await RolePermission.findAll({ where: { roleId: otherRoleIds } });
                const otherPermIds = new Set(otherPerms.map(rp => Number(rp.permissionId)));
                for (const permId of rolePermIds) {
                    if (!otherPermIds.has(permId)) {
                        await UserPermission.destroy({ where: { utilisateurId, permissionId: permId } });
                    }
                }
            } else {
                // Aucun autre rôle → révoquer toutes les permissions de ce rôle
                for (const permId of rolePermIds) {
                    await UserPermission.destroy({ where: { utilisateurId, permissionId: permId } });
                }
            }

            return res.status(200).json({ success: true, message: "Rôle retiré et permissions révoquées" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getUtilisateurRoles(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId } = req.params;
            const userRoles = await UserRole.findAll({
                where: { utilisateurId },
                include: [{ model: Role, as: 'role' }]
            });
            return res.status(200).send(userRoles);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    /**
     * Applique (et synchronise) les permissions d'un rôle à un utilisateur.
     * - Crée les permissions manquantes
     * - Révoque celles qui ne sont plus dans le rôle
     */
    static async appliquerRolePermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { id, utilisateurId } = req.params;

            // 1. Récupérer les permissions actuelles du rôle
            const rolePermissions = await RolePermission.findAll({ where: { roleId: id } });
            const rolePermissionIds = new Set(rolePermissions.map(rp => Number(rp.permissionId)));

            // 2. Récupérer les permissions existantes de l'utilisateur
            const existingUserPerms = await UserPermission.findAll({ where: { utilisateurId } });
            const existingMap = new Map<number, any>();
            for (const up of existingUserPerms) {
                existingMap.set(Number(up.permissionId), up);
            }

            let created = 0, revoked = 0, unchanged = 0;

            // 3. Créer les permissions manquantes + activer celles du rôle
            for (const permissionId of rolePermissionIds) {
                const existing = existingMap.get(permissionId);
                if (existing) {
                    if (!existing.estActif) {
                        await existing.update({ estActif: true });
                        created++;
                    } else {
                        unchanged++;
                    }
                } else {
                    await UserPermission.create({
                        utilisateurId,
                        permissionId,
                        estActif: true
                    } as any);
                    created++;
                }
            }

            // 4. Révoquer les permissions de l'utilisateur qui ne sont plus dans le rôle
            for (const [permissionId, existing] of existingMap) {
                if (!rolePermissionIds.has(Number(permissionId)) && existing.estActif) {
                    await existing.update({ estActif: false });
                    revoked++;
                }
            }

            return res.status(200).json({
                success: true,
                message: `Permissions synchronisées : ${created} ajoutée(s), ${revoked} révoquée(s), ${unchanged} inchangée(s)`,
                created,
                revoked,
                unchanged
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

import { Request, Response } from "express";
import { Role } from "../models/Role";
import { RolePermission } from "../models/RolePermission";
import { Permission } from "../models/Permission";
import { UserRole } from "../models/UserRole";
import { UserPermission } from "../models/UserPermission";
import { Utilisateur } from "../models/Utilisateur";

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
            const { nom, description } = req.body;
            if (!nom) {
                return res.status(400).json({ success: false, message: "Le nom est requis" });
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
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ success: false, message: "Rôle non trouvé" });
            }

            await RolePermission.destroy({ where: { roleId: id } });

            if (Array.isArray(permissionIds) && permissionIds.length > 0) {
                const newPermissions = permissionIds.map((permissionId: number) => ({
                    roleId: Number(id) as any,
                    permissionId: permissionId as any
                }));
                await RolePermission.bulkCreate(newPermissions);
            }

            return res.status(200).json({ success: true, message: "Permissions du rôle mises à jour" });
        } catch (error) {
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

            await UserRole.findOrCreate({
                where: { utilisateurId, roleId: id },
                defaults: { utilisateurId, roleId: id }
            });

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

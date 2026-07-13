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
                include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'email'] }]
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

            await UserRole.destroy({
                where: { utilisateurId, roleId: id }
            });

            return res.status(200).json({ success: true, message: "Rôle retiré de l'utilisateur" });
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

    static async appliquerRolePermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { id, utilisateurId } = req.params;

            const rolePermissions = await RolePermission.findAll({ where: { roleId: id } });

            for (const rp of rolePermissions) {
                await UserPermission.findOrCreate({
                    where: { utilisateurId, permissionId: rp.permissionId },
                    defaults: { utilisateurId, permissionId: rp.permissionId, estActif: true }
                });
            }

            return res.status(200).json({ success: true, message: "Permissions du rôle appliquées à l'utilisateur" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

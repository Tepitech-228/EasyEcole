import { Request, Response } from "express";
import { Permission } from "../models/Permission";
import { UserPermission } from "../models/UserPermission";
import { UserRole } from "../models/UserRole";
import { Role } from "../models/Role";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class PermissionController {

    static async getAllPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['parentKey', 'ASC'], ['key', 'ASC']] });

            const grouped: Record<string, any> = {};
            for (const perm of permissions) {
                if (!grouped[perm.module]) {
                    grouped[perm.module] = [];
                }
                grouped[perm.module].push({
                    id: perm.id,
                    key: perm.key,
                    libelle: perm.libelle,
                    type: perm.type,
                    parentKey: perm.parentKey
                });
            }

            return res.status(200).send(grouped);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async getAllPermissionsFlat(req: Request, res: Response): Promise<Response> {
        try {
            const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['key', 'ASC']] });
            return res.status(200).send(permissions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async getUtilisateurPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId } = req.params;

            const utilisateur = await Utilisateur.findByPk(utilisateurId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            const userPermissions = await UserPermission.findAll({
                where: { utilisateurId },
                include: [{ model: Permission, as: 'permission' }]
            });

            return res.status(200).send(userPermissions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async updateUtilisateurPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId } = req.params;
            const { permissions } = req.body;

            if (!Array.isArray(permissions)) {
                return res.status(400).json({ success: false, message: "Le champ 'permissions' doit être un tableau" });
            }

            const utilisateur = await Utilisateur.findByPk(utilisateurId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            for (const item of permissions) {
                if (item.estActif) {
                    await UserPermission.findOrCreate({
                        where: { utilisateurId, permissionId: item.permissionId },
                        defaults: { utilisateurId, permissionId: item.permissionId, estActif: true }
                    });
                } else {
                    await UserPermission.destroy({
                        where: { utilisateurId, permissionId: item.permissionId }
                    });
                }
            }

            return res.status(200).json({ success: true, message: "Permissions mises à jour" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async copyPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId, fromUtilisateurId } = req.params;

            const sourcePermissions = await UserPermission.findAll({
                where: { utilisateurId: fromUtilisateurId, estActif: true }
            });

            await UserPermission.destroy({ where: { utilisateurId } });

            const newPermissions = sourcePermissions.map(sp => ({
                utilisateurId,
                permissionId: sp.permissionId,
                estActif: true
            }));

            if (newPermissions.length > 0) {
                await UserPermission.bulkCreate(newPermissions);
            }

            return res.status(200).json({ success: true, message: "Permissions copiées" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async check(req: Request, res: Response): Promise<Response> {
        try {
            const { key } = req.body;
            const utilisateurId = (req as any).utilisateurId;

            if (!key) {
                return res.status(400).json({ success: false, message: "La clé de permission est requise" });
            }

            const permission = await Permission.findOne({ where: { key } });
            if (!permission) {
                return res.status(200).json({ granted: false });
            }

            const userPermission = await UserPermission.findOne({
                where: { utilisateurId, permissionId: permission.id, estActif: true }
            });

            return res.status(200).json({ granted: !!userPermission });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }

    static async mesPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const role = (req as any).utilisateurRole as RolesUtilisateur;

            if (role === RolesUtilisateur.ADMIN) {
                const allPermissions = await Permission.findAll({ attributes: ['key'] });
                const keys = allPermissions.map(p => p.key);
                return res.status(200).send({ permissions: keys, configured: true });
            }

            const userPermissionKeys = new Set<string>();

            const userRoles = await UserRole.findAll({ where: { utilisateurId } });
            if (userRoles.length > 0) {
                const roleIds = userRoles.map(ur => ur.roleId);
                const roles = await Role.findAll({
                    where: { id: roleIds },
                    include: [{ model: Permission, as: 'permissions', attributes: ['key'] }]
                });
                for (const r of roles) {
                    const perms = (r as any).permissions || [];
                    for (const p of perms) {
                        userPermissionKeys.add(p.key);
                    }
                }
            } else {
                const roleNameMap: Record<string, string> = {
                    [RolesUtilisateur.INSTITUTION]: 'Directeur',
                    [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
                    [RolesUtilisateur.APPRENANT]: 'Apprenant',
                    [RolesUtilisateur.CAISSIER_BANQUE]: 'Comptable',
                    [RolesUtilisateur.CABINET_COMPTABLE]: 'Comptable',
                    [RolesUtilisateur.COMITE_ORIENTATION]: 'Parent',
                };
                const roleName = roleNameMap[role];
                if (roleName) {
                    const fallbackRole = await Role.findOne({
                        where: { nom: roleName },
                        include: [{ model: Permission, as: 'permissions', attributes: ['key'] }]
                    });
                    if (fallbackRole) {
                        const perms = (fallbackRole as any).permissions || [];
                        for (const p of perms) {
                            userPermissionKeys.add(p.key);
                        }
                    }
                }
            }

            const userPermissions = await UserPermission.findAll({
                where: { utilisateurId, estActif: true },
                include: [{ model: Permission, as: 'permission', attributes: ['key'] }]
            });
            for (const up of userPermissions) {
                const perm = (up as any).permission;
                if (perm?.key) {
                    userPermissionKeys.add(perm.key);
                }
            }

            const keys = Array.from(userPermissionKeys);
            const configured = keys.length > 0;

            return res.status(200).send({ permissions: keys, configured });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
        }
    }
}

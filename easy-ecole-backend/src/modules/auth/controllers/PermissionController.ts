import { Request, Response } from "express";
import { Permission } from "../models/Permission";
import { UserPermission } from "../models/UserPermission";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Op } from "sequelize";

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
            return res.status(500).json({ success: false, error });
        }
    }

    static async getAllPermissionsFlat(req: Request, res: Response): Promise<Response> {
        try {
            const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['key', 'ASC']] });
            return res.status(200).send(permissions);
        } catch (error) {
            return res.status(500).json({ success: false, error });
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
            return res.status(500).json({ success: false, error });
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
            return res.status(500).json({ success: false, error });
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
            return res.status(500).json({ success: false, error });
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
            return res.status(500).json({ success: false, error });
        }
    }

    static async mesPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;

            const role = (req as any).utilisateurRole;
            if (role === 'admin') {
                const allPermissions = await Permission.findAll({ attributes: ['key'] });
                const keys = allPermissions.map(p => p.key);
                return res.status(200).send({ permissions: keys, configured: true });
            }

            const totalConfigs = await UserPermission.count({ where: { utilisateurId } });
            const configured = totalConfigs > 0;

            if (!configured) {
                return res.status(200).send({ permissions: [], configured: false });
            }

            const userPermissions = await UserPermission.findAll({
                where: { utilisateurId, estActif: true },
                include: [{ model: Permission, as: 'permission', attributes: ['key'] }]
            });

            const keys = userPermissions.map(up => (up as any).permission?.key).filter(Boolean);

            return res.status(200).send({ permissions: keys, configured: true });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

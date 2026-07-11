import { Router, Request, Response } from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import { MENU_CONFIG, MenuPoleConfig, MenuGroupConfig, MenuItemConfig } from "./menu.config";
import { RolesUtilisateur } from "../../core/enums/RolesUtilisateur";
import { Permission } from "../auth/models/Permission";
import { Role } from "../auth/models/Role";
import { UserPermission } from "../auth/models/UserPermission";
import { UserRole } from "../auth/models/UserRole";

const router = Router();

function filterMenuByPermissions(
    menu: MenuPoleConfig[],
    userRole: RolesUtilisateur,
    userPermissionKeys: Set<string>
): MenuPoleConfig[] {
    return menu.reduce<MenuPoleConfig[]>((poles, pole) => {
        if (pole.allowedRoles && !pole.allowedRoles.includes(userRole)) {
            return poles;
        }

        const filteredGroups = pole.groups.reduce<MenuGroupConfig[]>((groups, group) => {
            if (group.allowedRoles && !group.allowedRoles.includes(userRole)) {
                return groups;
            }

            const filteredItems = group.items.filter(item => {
                if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
                    return false;
                }
                if (item.permissionKey && !userPermissionKeys.has(item.permissionKey)) {
                    return false;
                }
                return true;
            });

            if (filteredItems.length === 0) {
                return groups;
            }

            groups.push({ ...group, items: filteredItems });
            return groups;
        }, []);

        if (filteredGroups.length === 0) {
            return poles;
        }

        poles.push({ ...pole, groups: filteredGroups });
        return poles;
    }, []);
}

router.get('/', Authenticate, async (req: Request, res: Response) => {
    try {
        const userRole = req.utilisateurRole as RolesUtilisateur;
        const utilisateurId = req.utilisateurId;

        if (!userRole) {
            return res.status(200).json([]);
        }

        if (userRole === RolesUtilisateur.ADMIN) {
            return res.status(200).json(MENU_CONFIG);
        }

        const userPermissionKeys = new Set<string>();

        const userRoles = await UserRole.findAll({ where: { utilisateurId } });
        if (userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.roleId);
            const roles = await Role.findAll({
                where: { id: roleIds },
                include: [{ model: Permission, as: 'permissions', attributes: ['key'] }]
            });
            for (const role of roles) {
                const perms = (role as any).permissions || [];
                for (const p of perms) {
                    userPermissionKeys.add(p.key);
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

        const filteredMenu = filterMenuByPermissions(MENU_CONFIG, userRole, userPermissionKeys);
        return res.status(200).json(filteredMenu);
    } catch (error) {
        console.error('Erreur lors du chargement du menu:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

export default router;

import { Router, Request, Response } from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import { MENU_CONFIG, MenuPoleConfig, MenuGroupConfig, MenuItemConfig } from "./menu.config";
import { RolesUtilisateur } from "../../core/enums/RolesUtilisateur";
import { Permission } from "../auth/models/Permission";
import { Role } from "../auth/models/Role";
import { UserPermission } from "../auth/models/UserPermission";
import { UserRole } from "../auth/models/UserRole";
import { VerificationPaiementService } from "../inscription/services/VerificationPaiementService";

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
                if (item.allowedRoles) {
                    return item.allowedRoles.includes(userRole);
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

/**
 * Entrées du menu que l'on conserve lorsque l'étudiant est en situation de blocage
 * paiement (statut 'rouge') : uniquement ce qui permet de régulariser.
 * Identification par permissionKey (identifiants stables) ET par route (univoque)
 * pour éviter les faux positifs sur d'autres entrées homonymes (« Paiements »
 * existe aussi dans Reporting et Espace Parents). Structure réelle du menu :
 * items { label, route, icon, permissionKey }.
 *   - « Mes bordereaux »  → /inscription/bordereaux → permissionKey 'menu.finances.bordereaux'
 *   - « Paiements »       → /inscription/paiements  → permissionKey 'menu.finances.paiements'
 */
const ENTREES_REGULARISATION_PAIEMENT: ReadonlySet<string> = new Set([
    'menu.finances.bordereaux',
    'menu.finances.paiements',
]);

const ROUTES_REGULARISATION_PAIEMENT: ReadonlySet<string> = new Set([
    '/inscription/bordereaux',
    '/inscription/paiements',
]);

export function filtrerMenuPourRegularisation(menu: MenuPoleConfig[]): MenuPoleConfig[] {
    return menu.reduce<MenuPoleConfig[]>((poles, pole) => {
        const groups = pole.groups.reduce<MenuGroupConfig[]>((groupsAcc, group) => {
            const items = group.items.filter(item =>
                (item.permissionKey && ENTREES_REGULARISATION_PAIEMENT.has(item.permissionKey)) ||
                (item.route && ROUTES_REGULARISATION_PAIEMENT.has(item.route))
            );
            if (items.length === 0) {
                return groupsAcc;
            }
            groupsAcc.push({ ...group, items });
            return groupsAcc;
        }, []);

        if (groups.length === 0) {
            return poles;
        }

        poles.push({ ...pole, groups });
        return poles;
    }, []);
}

router    /**
     * @openapi
     * /:
     *   get:
     *     tags: [Menu]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', Authenticate, async (req: Request, res: Response) => {
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
        } else {
            const roleNameMap: Record<string, string> = {
                [RolesUtilisateur.INSTITUTION]: 'Directeur',
                [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
                [RolesUtilisateur.APPRENANT]: 'Apprenant',
                [RolesUtilisateur.CAISSIER_BANQUE]: 'Comptable',
                [RolesUtilisateur.CABINET_COMPTABLE]: 'Comptable',
                [RolesUtilisateur.COMITE_ORIENTATION]: 'Parent',
            };
            const roleName = roleNameMap[userRole];
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

        const filteredMenu = filterMenuByPermissions(MENU_CONFIG, userRole, userPermissionKeys);

        // ── Blocage partiel du menu pour les étudiants en situation de paiement
        //    en retard (chantier modalités 1x/3x/10x) ─────────────────────────────
        //    Uniquement pour le rôle APPRENANT (les parents ne sont pas impactés).
        //    Le calcul est fait À LA VOLÉE à chaque appel : le déblocage est donc
        //    automatique dès que le statut redevient 'vert' (aucun flag persistant).
        //    En statut 'rouge', ne sont conservées que les entrées permettant de
        //    régulariser : « Mes bordereaux » et « Paiements ».
        if (userRole === RolesUtilisateur.APPRENANT) {
            const paiement = await VerificationPaiementService.verifierPaiement(utilisateurId!);
            if (paiement.statut === 'rouge') {
                return res.status(200).json(filtrerMenuPourRegularisation(filteredMenu));
            }
        }

        return res.status(200).json(filteredMenu);
    } catch (error) {
        console.error('Erreur lors du chargement du menu:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

export default router;

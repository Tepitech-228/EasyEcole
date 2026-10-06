import { Request, Response } from 'express'
import { Permission } from '../../modules/auth/models/Permission'
import { UserPermission } from '../../modules/auth/models/UserPermission'
import { RolePermission } from '../../modules/auth/models/RolePermission'
import { UserRole } from '../../modules/auth/models/UserRole'
import { Role } from '../../modules/auth/models/Role'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'

const permissionCache = new Map<string, { id: number; expiresAt: number }>()
const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000

export default (key: string) => {
    return async (req: Request, res: Response, next: Function) => {
        try {
            const role = (req as any).utilisateurRole
            const utilisateurId = (req as any).utilisateurId

            if (role === RolesUtilisateur.ADMIN) {
                return next()
            }

            const now = Date.now()
            const cachedPermission = permissionCache.get(key)
            const permissionId = cachedPermission && cachedPermission.expiresAt > now
                ? cachedPermission.id
                : (await Permission.findOne({ where: { key }, attributes: ['id'] }))?.id
            if (!permissionId) {
                return res.status(403).json({ success: false, message: "Permission introuvable" })
            }
            permissionCache.set(key, { id: Number(permissionId), expiresAt: now + PERMISSION_CACHE_TTL_MS })

            const [userPermission, userRoles] = await Promise.all([
                UserPermission.findOne({
                    where: { utilisateurId, permissionId, estActif: true },
                    attributes: ['id'],
                }),
                UserRole.findAll({ where: { utilisateurId }, attributes: ['roleId'] }),
            ])
            if (userPermission) {
                return next()
            }

            if (userRoles.length > 0) {
                const roleIds = userRoles.map(ur => ur.roleId)
                const rolePermission = await RolePermission.findOne({
                    where: { roleId: roleIds, permissionId },
                    attributes: ['id'],
                })
                if (rolePermission) {
                    return next()
                }
            } else {
                const roleNameMap: Partial<Record<RolesUtilisateur, string>> = {
                    [RolesUtilisateur.INSTITUTION]: 'Directeur',
                    [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
                    [RolesUtilisateur.APPRENANT]: 'Apprenant',
                    [RolesUtilisateur.CAISSIER_BANQUE]: 'Comptable',
                    [RolesUtilisateur.CABINET_COMPTABLE]: 'Comptable',
                    [RolesUtilisateur.COMITE_ORIENTATION]: 'Comité',
                    [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
                    [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel administratif',
                    [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources Humaines',
                    [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
                    [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
                    [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur Général',
                    [RolesUtilisateur.PARENT]: 'Parent',
                }
                const roleName = roleNameMap[role as RolesUtilisateur]
                if (roleName) {
                    const fallbackRole = await Role.findOne({ where: { nom: roleName }, attributes: ['id'] })
                    if (fallbackRole) {
                        const rolePermission = await RolePermission.findOne({
                            where: { roleId: fallbackRole.id, permissionId },
                            attributes: ['id'],
                        })
                        if (rolePermission) {
                            return next()
                        }
                    }
                }
            }

            if (role === RolesUtilisateur.SUPERVISEUR_GENERAL) {
                const supervisorRole = await Role.findOne({ where: { nom: 'Superviseur Général' }, attributes: ['id'] })
                if (supervisorRole) {
                    const rolePermission = await RolePermission.findOne({
                        where: { roleId: supervisorRole.id, permissionId },
                        attributes: ['id'],
                    })
                    if (rolePermission) return next()
                }
            }

            return res.status(403).json({
                success: false,
                message: "Vous n'avez pas la permission nécessaire pour cette action"
            })
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }
}

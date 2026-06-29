import { Request, Response } from 'express'
import { Permission } from '../../modules/auth/models/Permission'
import { UserPermission } from '../../modules/auth/models/UserPermission'
import { RolePermission } from '../../modules/auth/models/RolePermission'
import { UserRole } from '../../modules/auth/models/UserRole'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'

export default (key: string) => {
    return async (req: Request, res: Response, next: Function) => {
        try {
            const role = (req as any).utilisateurRole
            const utilisateurId = (req as any).utilisateurId

            if (role === RolesUtilisateur.ADMIN) {
                return next()
            }

            const permission = await Permission.findOne({ where: { key } })
            if (!permission) {
                return next()
            }

            // Check direct user permissions
            const userPermission = await UserPermission.findOne({
                where: { utilisateurId, permissionId: permission.id, estActif: true }
            })
            if (userPermission) {
                return next()
            }

            // Check role permissions
            const userRoles = await UserRole.findAll({ where: { utilisateurId } })
            if (userRoles.length > 0) {
                const roleIds = userRoles.map(ur => ur.roleId)
                const rolePermission = await RolePermission.findOne({
                    where: { roleId: roleIds, permissionId: permission.id }
                })
                if (rolePermission) {
                    return next()
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

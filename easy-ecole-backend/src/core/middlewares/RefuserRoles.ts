import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

/**
 * Refuse l'accès aux rôles listés (liste noire).
 *
 * Utilisé pour fermer les endpoints de données scolaires (présences, notes,
 * bulletins…) aux rôles non concernés — typiquement `PARENT`, qui traverse le
 * middleware `InscriptionComplete` mais n'est scopé par aucun contrôleur et
 * recevrait donc l'intégralité des données.
 *
 * À monter dans un routeur monté sur un chemin dédié (`router.use(...)`), et
 * NON dans un routeur monté sur `/` (il intercepterait les requêtes destinées
 * aux routeurs suivants).
 */
export const RefuserRoles = (...rolesRefuses: RolesUtilisateur[]) => {
    return (req: Request, res: Response, next: Function) => {
        const role = (req as any).utilisateurRole;
        if (rolesRefuses.includes(role)) {
            return res.status(403).json({ success: false, message: "Accès non autorisé pour ce rôle" });
        }
        return next();
    };
};

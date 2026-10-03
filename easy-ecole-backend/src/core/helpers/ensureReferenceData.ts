import { Sequelize } from "sequelize";
import { REF_ROLES, REF_PERMISSIONS, REF_ROLE_PERMISSIONS } from "../data/reference-data";
import { MENU_CONFIG } from "../../modules/menu/menu.config";

/**
 * ensureReferenceData — seed automatique idempotent du socle d'autorisations,
 * exécuté à CHAQUE démarrage (dev ET prod), avant l'ouverture du serveur.
 *
 * Pourquoi : en production (Dokploy), la base est créée par sync Sequelize
 * (structure seule). Sans données de référence :
 *   - aut_permissions vide   → menus et listes déroulants vides ;
 *   - aut_role_permissions vide → aucun rôle autorisé → 403 partout.
 *
 * Principe d'idempotence SANS dépendre des IDs auto-incrémentés (qui peuvent
 * diverger entre environnements) :
 *   - permissions résolues par leur clé naturelle `key` (UNIQUE en base) ;
 *   - rôles résolus par leur `nom` ;
 *   - liaisons rôle↔permission résolues via ces identifiants naturels
 *     (UNIQUE composite roleId+permissionId).
 */
export async function ensureReferenceData(sequelize: Sequelize): Promise<void> {
    // Inclure automatiquement chaque entrée de menu au catalogue de droits.
    // Cela évite qu'une nouvelle route existe dans le menu mais soit absente
    // de l'écran d'attribution des permissions.
    const permissionsByKey = new Map(REF_PERMISSIONS.map(permission => [permission.key, permission]));
    for (const pole of MENU_CONFIG) {
        for (const group of pole.groups) {
            for (const item of group.items) {
                if (item.permissionKey && !permissionsByKey.has(item.permissionKey)) {
                    permissionsByKey.set(item.permissionKey, {
                        key: item.permissionKey,
                        libelle: item.label,
                        module: pole.label,
                        type: 'menu',
                        parentKey: null,
                    });
                }
            }
        }
    }

    // 1. Permissions (upsert par clé naturelle `key`)
    for (const p of permissionsByKey.values()) {
        await sequelize.query(
            "INSERT INTO `aut_permissions` (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`) " +
            "VALUES (:key, :libelle, :module, :type, :parentKey, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE `libelle` = VALUES(`libelle`), `module` = VALUES(`module`), " +
            "`type` = VALUES(`type`), `parentKey` = VALUES(`parentKey`), `deletedAt` = NULL",
            { replacements: { key: p.key, libelle: p.libelle, module: p.module, type: p.type, parentKey: p.parentKey } }
        ).catch((err: any) => console.warn("[ensureReferenceData] permission", p.key, "ignorée:", err?.message))
    }

    // 2. Rôles (pas de contrainte unique fiable → select puis insert/update)
    // Les permissions par défaut sont initialisées uniquement pour les nouveaux
    // profils; les changements faits ensuite dans l'écran d'administration ne
    // doivent pas être réactivés à chaque redémarrage.
    const rolesCrees = new Set<string>()
    for (const r of REF_ROLES) {
        const [rows]: any = await sequelize.query(
            "SELECT id FROM `aut_roles` WHERE `nom` = :nom LIMIT 1",
            { replacements: { nom: r.nom } }
        )
        if ((rows as any[]).length === 0) {
            const [insertResult]: any = await sequelize.query(
                "INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`) VALUES (:nom, :description, NOW(), NOW())",
                { replacements: { nom: r.nom, description: r.description } }
            ).catch((err: any) => {
                console.warn("[ensureReferenceData] rôle", r.nom, "ignoré:", err?.message)
                return [{ affectedRows: 0 }, undefined]
            })
            if (insertResult?.affectedRows > 0) rolesCrees.add(r.nom)
        } else {
            await sequelize.query(
                "UPDATE `aut_roles` SET `description` = :description, `deletedAt` = NULL WHERE `id` = :id",
                { replacements: { description: r.description, id: (rows as any[])[0].id } }
            ).catch(() => undefined)
        }
    }

    // 3. Liaisons rôle ↔ permission (résolution par identifiants naturels)
    const [roleRows]: any = await sequelize.query("SELECT id, `nom` FROM `aut_roles`")
    const [permRows]: any = await sequelize.query("SELECT id, `key` FROM `aut_permissions`")
    const roleIdByNom = new Map<string, number>((roleRows as any[]).map(r => [r.nom, r.id]))
    const permIdByKey = new Map<string, number>((permRows as any[]).map(p => [p.key, p.id]))

    let liaisonsCreees = 0
    for (const rp of REF_ROLE_PERMISSIONS) {
        if (!rolesCrees.has(rp.roleNom)) continue
        const roleId = roleIdByNom.get(rp.roleNom)
        const permissionId = permIdByKey.get(rp.permissionKey)
        if (!roleId || !permissionId) continue // référentiel incomplet côté cible : on ignore silencieusement
        const [res]: any = await sequelize.query(
            "INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`) " +
            "VALUES (:roleId, :permissionId, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE `deletedAt` = NULL",
            { replacements: { roleId, permissionId } }
        )
        if (res && res.affectedRows > 0) liaisonsCreees++
    }

    // Log discret : ne parler que si des écritures ont réellement eu lieu
    console.log(`[ensureReferenceData] socle autorisations vérifié (${REF_PERMISSIONS.length} permissions, ${REF_ROLES.length} rôles, ${liaisonsCreees} liaison(s) créée(s)/réactivée(s))`)
}

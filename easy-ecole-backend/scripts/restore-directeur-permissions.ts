/**
 * Restauration du rôle Directeur (id=2) après écrasement par le test de diagnostic.
 * Source de vérité : REF_ROLE_PERMISSIONS du référentiel (141 entrées « Directeur »).
 * Usage : npx ts-node --transpile-only scripts/restore-directeur-permissions.ts
 */
import { DatabaseConnection } from '../src/core/helpers/DatabaseConnection';
import { REF_ROLE_PERMISSIONS } from '../src/core/data/reference-data';

const sequelize = DatabaseConnection.getInstance().sequelize;

async function main(): Promise<void> {
    const cibles = REF_ROLE_PERMISSIONS.filter(rp => rp.roleNom === 'Directeur');
    console.log(`Référentiel : ${cibles.length} permissions « Directeur »`);

    const [roleRows]: any = await sequelize.query("SELECT id FROM aut_roles WHERE nom = 'Directeur'");
    const roleId = (roleRows as any[])[0]?.id;
    if (!roleId) { console.log('Rôle Directeur introuvable'); process.exit(1); }

    const [permRows]: any = await sequelize.query('SELECT id, `key` FROM aut_permissions');
    const permIdByKey = new Map<string, number>((permRows as any[]).map(p => [p.key, Number(p.id)]));

    // Purge complète (hard delete) pour repartir exactement du référentiel
    await sequelize.query('DELETE FROM aut_role_permissions WHERE roleId = ?', { replacements: [roleId] });

    let inserees = 0, ignorees = 0;
    for (const rp of cibles) {
        const permissionId = permIdByKey.get(rp.permissionKey);
        if (!permissionId) { console.warn(`  permission absente de la base : ${rp.permissionKey}`); ignorees++; continue; }
        await sequelize.query(
            'INSERT INTO aut_role_permissions (roleId, permissionId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE deletedAt = NULL',
            { replacements: [roleId, permissionId] }
        );
        inserees++;
    }

    const [[{ n }]]: any = await sequelize.query(
        'SELECT COUNT(*) AS n FROM aut_role_permissions WHERE roleId = ? AND deletedAt IS NULL',
        { replacements: [roleId] }
    );
    console.log(`Restauration : ${inserees} traitée(s), ${ignorees} ignorée(s) -> ${n} permission(s) active(s) pour le Directeur.`);
    await sequelize.close();
    process.exit(Number(n) === 141 ? 0 : 1);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

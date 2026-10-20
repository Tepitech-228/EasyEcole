/**
 * Ajoute les permissions de consultation manquantes au rôle Surveillant.
 *
 * Usage :
 *   npx ts-node src/core/scripts/fix-surveillant-permissions.ts
 *
 * Ce script :
 * À exécuter une fois sur une base existante après déploiement des permissions.
 */

import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { RolePermission } from '../../modules/auth/models/RolePermission';

async function fixSurveillantPermissions(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('  PERMISSIONS DE CONSULTATION SURVEILLANT');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const role = await Role.findOne({ where: { nom: 'Surveillant' } });
  if (!role) throw new Error('Rôle Surveillant introuvable. Lancez d’abord le seed des rôles.');

  const permissionKeys = [
    'menu.cours.cahiers-de-texte',
    'menu.pointage.historique',
    'menu.pointage.rapports',
  ];

  // Récupérer les permissions existantes
  const permissions = await Permission.findAll({
    where: { key: permissionKeys }
  });
  const foundKeys = new Set(permissions.map(permission => permission.key));
  const missingKeys = permissionKeys.filter(key => !foundKeys.has(key));
  if (missingKeys.length) {
    throw new Error(`Permissions manquantes : ${missingKeys.join(', ')}. Lancez d’abord le seed des permissions.`);
  }

  console.log(`  ✓ ${permissions.length} permissions trouvées sur ${permissionKeys.length} clés`);
  console.log('');

  // Créer les liaisons RolePermission
  let createdCount = 0;
  let existingCount = 0;

  for (const permission of permissions) {
    const [, created] = await RolePermission.findOrCreate({
      where: { roleId: role.id, permissionId: permission.id },
      defaults: { roleId: role.id, permissionId: permission.id }
    });

    if (created) {
      createdCount++;
    } else {
      existingCount++;
    }
  }

  console.log(`  ✓ Permissions créées: ${createdCount}`);
  console.log(`  ℹ Permissions déjà existantes: ${existingCount}`);
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('  PERMISSIONS SURVEILLANT CORRIGÉES');
  console.log('════════════════════════════════════════════════════');
  console.log('');
}

fixSurveillantPermissions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });

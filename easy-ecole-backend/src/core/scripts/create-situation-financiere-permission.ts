/**
 * Script pour créer la permission 'menu.finances.situation-financiere'
 * et l'accorder au rôle Comptable (Recouvrement).
 *
 * Usage :
 *   npx ts-node src/core/scripts/create-situation-financiere-permission.ts
 */

import { Permission } from '../../modules/auth/models/Permission';
import { Role } from '../../modules/auth/models/Role';
import { RolePermission } from '../../modules/auth/models/RolePermission';

async function createPermission(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('  CRÉATION PERMISSION SITUATION FINANCIÈRE');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Créer la permission si elle n'existe pas
  const [permission, created] = await Permission.findOrCreate({
    where: { key: 'menu.finances.situation-financiere' },
    defaults: {
      key: 'menu.finances.situation-financiere',
      libelle: 'Situation financière',
      module: 'Finances',
      type: 'menu',
      parentKey: 'menu.finances'
    }
  });

  if (created) {
    console.log(`  ✓ Permission créée: ${permission.key} (ID: ${permission.id})`);
  } else {
    console.log(`  ℹ Permission existe déjà: ${permission.key} (ID: ${permission.id})`);
  }
  console.log('');

  // Récupérer le rôle Comptable
  const role = await Role.findOne({ where: { nom: 'Comptable' } });
  if (!role) {
    console.error('  ✗ Rôle Comptable non trouvé');
    process.exit(1);
  }
  console.log(`  ✓ Rôle trouvé: ${role.nom} (ID: ${role.id})`);

  // Accorder la permission au rôle
  const [rolePermission, rpCreated] = await RolePermission.findOrCreate({
    where: { roleId: role.id, permissionId: permission.id },
    defaults: { roleId: role.id, permissionId: permission.id }
  });

  if (rpCreated) {
    console.log('  ✓ Permission accordée au rôle Comptable');
  } else {
    console.log('  ℹ Permission déjà accordée au rôle Comptable');
  }

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  PERMISSION CRÉÉE ET ACCORDÉE');
  console.log('════════════════════════════════════════════════════');
  console.log('');
}

createPermission()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });

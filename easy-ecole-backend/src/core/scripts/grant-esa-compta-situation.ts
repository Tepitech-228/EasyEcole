/**
 * Script pour accorder la permission 'menu.finances.situation-financiere' au rôle ESA_COMPTA.
 *
 * Usage :
 *   npx ts-node src/core/scripts/grant-esa-compta-situation.ts
 */

import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { RolePermission } from '../../modules/auth/models/RolePermission';

async function grantPermission(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('  ACCORD PERMISSION ESA-COMPTA');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Récupérer le rôle Comptable (équivalent ESA_COMPTA / recouvrement)
  const role = await Role.findOne({ where: { nom: 'Comptable' } });
  if (!role) {
    console.error('  ✗ Rôle Comptable non trouvé');
    process.exit(1);
  }
  console.log(`  ✓ Rôle trouvé: ${role.nom} (ID: ${role.id})`);

  // Récupérer la permission
  const permission = await Permission.findOne({ where: { key: 'menu.finances.situation-financiere' } });
  if (!permission) {
    console.error('  ✗ Permission menu.finances.situation-financiere non trouvée');
    process.exit(1);
  }
  console.log(`  ✓ Permission trouvée: ${permission.key} (ID: ${permission.id})`);

  // Créer la liaison
  const [rolePermission, created] = await RolePermission.findOrCreate({
    where: { roleId: role.id, permissionId: permission.id },
    defaults: { roleId: role.id, permissionId: permission.id }
  });

  if (created) {
    console.log('  ✓ Permission accordée avec succès');
  } else {
    console.log('  ℹ Permission déjà accordée');
  }

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  PERMISSION ACCORDÉE');
  console.log('════════════════════════════════════════════════════');
  console.log('');
}

grantPermission()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });

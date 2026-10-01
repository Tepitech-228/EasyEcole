/**
 * Script de correction des permissions du compte Surveillant.
 *
 * Usage :
 *   npx ts-node src/core/scripts/fix-surveillant-permissions.ts
 *
 * Ce script :
 * 1. Assigne le rôle 'surveillant' à l'utilisateur dans UserRole
 * 2. Crée les permissions RolePermission pour le rôle surveillant
 */

import { Utilisateur } from '../../modules/auth/models/Utilisateur';
import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { RolePermission } from '../../modules/auth/models/RolePermission';
import { UserRole } from '../../modules/auth/models/UserRole';
import { RolesUtilisateur } from '../enums/RolesUtilisateur';

async function fixSurveillantPermissions(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('  CORRECTION PERMISSIONS SURVEILLANT');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Récupérer l'utilisateur surveillant
  const utilisateur = await Utilisateur.findOne({ where: { identifiant: 'surveillant1' } });
  if (!utilisateur) {
    console.error('  ✗ Utilisateur surveillant1 non trouvé');
    process.exit(1);
  }

  console.log(`  ✓ Utilisateur trouvé: ${utilisateur.nom} ${utilisateur.prenoms} (ID: ${utilisateur.id})`);
  console.log('');

  // Récupérer ou créer le rôle Surveillant
  let role = await Role.findOne({ where: { nom: 'Surveillant' } });
  if (!role) {
    role = await Role.create({
      nom: 'Surveillant',
      description: 'Surveillance et discipline'
    });
    console.log(`  ✓ Rôle Surveillant créé (ID: ${role.id})`);
  } else {
    console.log(`  ✓ Rôle Surveillant trouvé (ID: ${role.id})`);
  }
  console.log('');

  // Assigner le rôle à l'utilisateur
  const [userRole, created] = await UserRole.findOrCreate({
    where: { utilisateurId: utilisateur.id as any, roleId: role.id as any },
    defaults: { utilisateurId: utilisateur.id as any, roleId: role.id as any }
  });

  if (created) {
    console.log(`  ✓ Rôle assigné à l'utilisateur`);
  } else {
    console.log(`  ℹ Rôle déjà assigné à l'utilisateur`);
  }
  console.log('');

  // Définir les permissions du surveillant
  const permissionKeys = [
    // Pointage
    'menu.pointage',
    'menu.pointage.terminal',
    'menu.pointage.historique',
    'menu.pointage.rapports',
    'menu.pointage.planning',
    'menu.pointage.shifts',
    'menu.pointage.absences',
    // Cours
    'menu.cours',
    'menu.cours.presences',
    'menu.cours.emplois-du-temps',
    'menu.cours.notes',
    // Scolarité
    'menu.scolarite',
    'menu.scolarite.discipline',
    'menu.scolarite.conseils',
    // Inscription
    'menu.inscription',
    'menu.inscription.parcours',
    'menu.inscription.salles',
    'menu.inscription.sessions',
    // Évaluations
    'menu.evaluations',
    'menu.evaluations.bulletins',
    'menu.evaluations.deliberations',
    'menu.evaluations.moyennes',
    'menu.evaluations.rattrapages',
    // Reporting
    'menu.reporting',
    'menu.reporting.notes',
    // Communication
    'menu.communication',
    'menu.communication.messagerie',
    // Paramètres
    'menu.parametres',
    'menu.parametres.mon-profil',
    'menu.parametres.mon-compte',
    // Actions
    'action.scolarite.discipline.sanctionner',
    'action.inscription.classe.creer',
    'action.inscription.classe.modifier',
    'action.inscription.classe.supprimer',
    'action.inscription.parcours.creer',
    'action.inscription.parcours.modifier',
    'action.inscription.parcours.supprimer',
    'action.inscription.session.creer',
    'action.inscription.session.modifier',
    'action.inscription.session.supprimer',
    'action.evaluation.bulletin.generer',
    'action.evaluation.bulletin.modifier',
    'action.evaluation.bulletin.publier',
    'action.evaluation.bulletin.supprimer',
    'action.evaluation.deliberation.organiser',
    'action.evaluation.deliberation.creer',
    'action.evaluation.deliberation.modifier',
    'action.evaluation.deliberation.supprimer',
    'action.evaluation.deliberation.charger-resultats',
    'action.evaluation.deliberation.modifier-resultat',
    'action.evaluation.deliberation.cloturer',
    'action.evaluation.rattrapage.assigner',
    'action.evaluation.rattrapage.notifier',
    'action.evaluation.rattrapage.saisir-notes',
    'action.cours.note.saisir',
    'action.cours.note.modifier',
  ];

  // Récupérer les permissions existantes
  const permissions = await Permission.findAll({
    where: { key: permissionKeys }
  });

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
  console.log('  Identifiants de connexion :');
  console.log('  ─────────────────────────────');
  console.log('  Identifiant : surveillant1');
  console.log('  Mot de passe : password123');
  console.log('');
}

fixSurveillantPermissions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });

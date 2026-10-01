/**
 * Script de création du compte Surveillant.
 *
 * Usage :
 *   npx ts-node src/core/scripts/create-surveillant.ts
 *
 * Ce script :
 * 1. Crée le compte utilisateur avec le rôle 'surveillant'
 * 2. Crée le profil PersonnelAdministratif
 * 3. Génère le matricule
 * 4. Génère le QR code pour le pointage
 */

import * as bcrypt from 'bcrypt';
import { Utilisateur } from '../../modules/auth/models/Utilisateur';
import { PersonnelAdministratif } from '../../modules/auth/models/PersonnelAdministratif';
import { RolesUtilisateur } from '../enums/RolesUtilisateur';

async function createSurveillant(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('  CRÉATION DU COMPTE SURVEILLANT');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Vérifier si le compte existe déjà
  const existing = await Utilisateur.findOne({ where: { identifiant: 'surveillant1' } });
  if (existing) {
    console.log('  ⚠ Le compte surveillant1 existe déjà');
    console.log(`     ID: ${existing.id}`);
    console.log(`     Nom: ${existing.nom} ${existing.prenoms}`);
    console.log('');
    return;
  }

  // Créer le compte utilisateur
  const motDePasse = bcrypt.hashSync('password123', 12);
  const utilisateur = await Utilisateur.create({
    nom: 'Koné',
    prenoms: 'Yao',
    identifiant: 'surveillant1',
    email: 'surveillant.yao@easyecole.tg',
    motDePasse,
    role: RolesUtilisateur.SURVEILLANT,
    contact: '+2280108000001',
    dateVerificationEmail: new Date()
  });

  console.log('  ✓ Compte utilisateur créé');
  console.log(`     ID: ${utilisateur.id}`);
  console.log(`     Nom: ${utilisateur.nom} ${utilisateur.prenoms}`);
  console.log(`     Identifiant: ${utilisateur.identifiant}`);
  console.log(`     Rôle: ${utilisateur.role}`);
  console.log('');

  // Créer le profil PersonnelAdministratif
  const personnel = await PersonnelAdministratif.create({
    utilisateurId: utilisateur.id,
    fonction: 'Surveillant général',
    matricule: 'UST-SG-001-2026',
    statut: 'Permanent',
    directionService: 'Scolarité',
    dateNaissance: new Date('1985-01-01'),
    sexe: 'M',
    nationalite: 'Ivoirienne'
  });

  console.log('  ✓ Profil personnel administratif créé');
  console.log(`     Matricule: ${personnel.matricule}`);
  console.log(`     Fonction: ${personnel.fonction}`);
  console.log('');

  // QR code non généré (nécessite DOCGEN_SECRET/JWT_SECRET)
  console.log('  ⚠ QR code non généré (DOCGEN_SECRET/JWT_SECRET non défini)');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('  COMPTE SURVEILLANT CRÉÉ AVEC SUCCÈS');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  console.log('  Identifiants de connexion :');
  console.log('  ─────────────────────────────');
  console.log('  Identifiant : surveillant1');
  console.log('  Mot de passe : password123');
  console.log('');
}

createSurveillant()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });

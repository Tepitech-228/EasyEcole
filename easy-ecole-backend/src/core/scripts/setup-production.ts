/**
 * Script de setup production pour EasyEcole.
 *
 * Ce script :
 * 1. Crée la base de données si elle n'existe pas
 * 2. Liste les tables DÉJÀ existantes en base
 * 3. Crée UNIQUEMENT les tables manquantes (sans toucher aux existantes)
 * 4. Exécute les seeds essentiels (idempotents)
 * 5. Affiche un rapport complet
 *
 * Usage :
 *   NODE_ENV=production npx ts-node src/core/scripts/setup-production.ts
 *
 * Variables d'environnement requises :
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

// ════════════════════════════════════════════════════
//  CONFIGURATION
// ════════════════════════════════════════════════════

const env = process.env.NODE_ENV || 'development';

const config = env === 'production'
  ? {
      database: process.env.DB_NAME || 'easyecole',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      options: {
        dialect: 'mysql' as const,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        logging: false,
      },
    }
  : require('../config/sequelize.json')[env];

const DB_NAME = config.database;
const DB_HOST = config.options.host;
const DB_PORT = config.options.port;
const DB_USER = config.username;
const DB_PASS = config.password || '';

// ════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════

function log(message: string) {
  console.log(`[SETUP] ${message}`);
}

function logError(message: string) {
  console.error(`[SETUP][ERREUR] ${message}`);
}

function logSuccess(message: string) {
  console.log(`[SETUP][OK] ${message}`);
}

function logWarning(message: string) {
  console.warn(`[SETUP][ATTENTION] ${message}`);
}

function logInfo(message: string) {
  console.log(`[SETUP][INFO] ${message}`);
}

// ════════════════════════════════════════════════════
//  ÉTAPE 1 : CRÉATION DE LA BASE DE DONNÉES
// ════════════════════════════════════════════════════

async function createDatabaseIfNotExists(): Promise<void> {
  log('Étape 1/5 : Vérification/création de la base de données...');

  const tempSeq = new Sequelize('', DB_USER, DB_PASS, {
    dialect: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    logging: false,
  });

  try {
    await tempSeq.authenticate();
    log(`Connexion au serveur MySQL réussie (${DB_HOST}:${DB_PORT})`);

    await tempSeq.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    logSuccess(`Base de données '${DB_NAME}' prête`);
  } catch (error: any) {
    logError(`Impossible de créer la base de données: ${error.message}`);
    throw error;
  } finally {
    await tempSeq.close();
  }
}

// ════════════════════════════════════════════════════
//  ÉTAPE 2 : LISTE DES TABLES EXISTANTES
// ════════════════════════════════════════════════════

async function getExistingTables(sequelize: Sequelize): Promise<Set<string>> {
  log('Étape 2/5 : Analyse des tables existantes...');

  const [rows] = await sequelize.query('SHOW TABLES');
  const existingTables = new Set<string>();

  for (const row of rows as any[]) {
    const tableName = Object.values(row)[0] as string;
    existingTables.add(tableName);
  }

  logInfo(`${existingTables.size} tables trouvées en base`);
  return existingTables;
}

// ════════════════════════════════════════════════════
//  ÉTAPE 3 : CRÉATION DES TABLES MANQUANTES
// ════════════════════════════════════════════════════

async function createMissingTables(
  sequelize: Sequelize,
  existingTables: Set<string>
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  log('Étape 3/5 : Création des tables manquantes...');

  // Import de TOUS les modèles
  require('../../modules/auth/models/_associations');
  require('../../modules/auth/models/PersonnelAdministratif');
  require('../../modules/orientation/models/_associations');
  require('../../modules/inscription/models/_associations');
  require('../../modules/inscription/models/Mcc');
  require('../../modules/inscription/models/RegleEvaluation');
  require('../../modules/inscription/models/SemestreAcademique');
  require('../../modules/inscription/models/SessionExamen');
  require('../../modules/inscription/models/Absence');
  require('../../modules/inscription/models/Equivalence');
  require('../../modules/inscription/models/Dispense');
  require('../../modules/inscription/models/DesignationMemoire');
  require('../../modules/inscription/models/RattrapageDocumentDepose');
  require('../../modules/inscription/models/RattrapageComiteVote');
  require('../../modules/inscription/models/TypeOperationBordereau');
  require('../../modules/stage/models/_associations');
  require('../../modules/stock/models/_associations');
  require('../../modules/immobilisation/models/_associations');
  require('../../modules/immobilisation/models/RebutImmobilisation');
  require('../../modules/bulletins/models/_associations');
  require('../../modules/bulletins/models/EchelleNote');
  require('../../modules/bulletins/models/AuditNote');
  require('../../modules/bulletins/models/JuryMembre');
  require('../../modules/scolarite/models/_associations');
  require('../../modules/scolarite/models/SanctionDiscipline');
  require('../../modules/scolarite/models/RegistreAcademique');
  require('../../modules/scolarite/models/EvenementCalendrier');
  require('../../modules/rh/models/_associations');
  require('../../modules/achats/models/_associations');
  require('../../modules/comptabilite/models/_associations');
  require('../../modules/communication/models/_associations');
  require('../../modules/communication/models/Communication');
  require('../../modules/communication/models/Actualite');
  require('../../modules/elearning/models/_associations');
  require('../../modules/elearning/models/Notification');
  require('../../modules/reporting/models/_associations');
  require('../../modules/etablissement/models/Etablissement');
  require('../../modules/ged/models/_associations');
  require('../../modules/marche/MarcheModule');
  require('../../modules/menu/MenuRoutes');

  const models = sequelize.models;
  const modelCount = Object.keys(models).length;
  logInfo(`${modelCount} modèles enregistrés`);

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Désactiver les checks de FK pendant la création
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const [modelName, model] of Object.entries(models)) {
    const tableName = (model as any).getTableName();

    if (existingTables.has(tableName)) {
      skipped.push(tableName);
      continue;
    }

    try {
      // Créer UNIQUEMENT cette table (sans alter)
      await (model as any).sync();
      created.push(tableName);
      logSuccess(`Table créée: ${tableName}`);
    } catch (error: any) {
      // Ignorer les erreurs connues
      const knownErrors = [
        'SequelizeUnknownConstraintError',
        'ER_FK_INCORRECT_OPTION',
        'ER_CANT_CREATE_TABLE',
        'ER_TOO_MANY_KEYS',
        'ER_DUP_KEYNAME',
      ];
      const isKnown = knownErrors.some(
        (e) => error.name === e || error?.parent?.code === e
      );
      if (isKnown) {
        logWarning(`Table ${tableName} ignorée: ${error.message}`);
        skipped.push(tableName);
      } else {
        logError(`Table ${tableName} en erreur: ${error.message}`);
        errors.push(tableName);
      }
    }
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  return { created, skipped, errors };
}

// ════════════════════════════════════════════════════
//  ÉTAPE 4 : SEEDS ESSENTIELS (IDEMPOTENTS)
// ════════════════════════════════════════════════════

async function runSeeds(sequelize: Sequelize): Promise<void> {
  log('Étape 4/5 : Exécution des seeds essentiels...');

  try {
    require('./seed');
    logSuccess('Seeds exécutés');
  } catch (seedError: any) {
    logWarning(`Seed ignoré: ${seedError.message}`);
  }
}

// ════════════════════════════════════════════════════
//  ÉTAPE 5 : RAPPORT FINAL
// ════════════════════════════════════════════════════

async function printReport(
  sequelize: Sequelize,
  existingTables: Set<string>,
  created: string[],
  skipped: string[],
  errors: string[]
): Promise<void> {
  log('Étape 5/5 : Rapport final...');

  try {
    const [tables] = await sequelize.query('SHOW TABLES');
    const totalTables = (tables as any[]).length;

    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('  RAPPORT DE SETUP PRODUCTION');
    console.log('════════════════════════════════════════════════════');
    console.log(`  Base: ${DB_NAME}`);
    console.log(`  Tables en base: ${totalTables}`);
    console.log(`  Tables existantes (non modifiées): ${skipped.length}`);
    console.log(`  Tables créées: ${created.length}`);
    console.log(`  Erreurs: ${errors.length}`);
    console.log('════════════════════════════════════════════════════');

    if (created.length > 0) {
      console.log('');
      console.log('  Tables créées :');
      created.forEach((t) => console.log(`    + ${t}`));
    }

    if (errors.length > 0) {
      console.log('');
      console.log('  Tables en erreur :');
      errors.forEach((t) => console.log(`    ! ${t}`));
    }

    // Vérification des tables critiques
    const criticalTables = ['Utilisateur', 'Permission', 'RolePermission', 'UserRole'];
    console.log('');
    console.log('  Vérification tables critiques :');
    for (const table of criticalTables) {
      const [result] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
      if ((result as any[]).length > 0) {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        const count = (countResult[0] as any).count;
        console.log(`    [OK] ${table} (${count} enregistrements)`);
      } else {
        console.log(`    [ERREUR] ${table} ABSENTE`);
      }
    }

    console.log('');

  } catch (error: any) {
    logWarning(`Rapport impossible: ${error.message}`);
  }
}

// ════════════════════════════════════════════════════
//  EXÉCUTION PRINCIPALE
// ════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  EASYÉCOLE — SETUP PRODUCTION');
  console.log(`  Environnement: ${env}`);
  console.log(`  Base: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const startTime = Date.now();

  try {
    // Étape 1 : Créer la base
    await createDatabaseIfNotExists();

    // Connexion à la base
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();
    log(`Connecté à '${DB_NAME}'`);

    // Étape 2 : Lister les tables existantes
    const existingTables = await getExistingTables(sequelize);

    // Étape 3 : Créer uniquement les tables manquantes
    const { created, skipped, errors } = await createMissingTables(sequelize, existingTables);

    // Étape 4 : Seeds
    await runSeeds(sequelize);

    // Étape 5 : Rapport
    await printReport(sequelize, existingTables, created, skipped, errors);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logSuccess(`Setup terminé en ${duration}s`);
    console.log('');

  } catch (error: any) {
    console.log('');
    logError(`Setup échoué: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Lancer le script
main();

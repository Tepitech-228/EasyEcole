#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ============================================================================
 * check-migrations-readiness.cjs — Audit PRÉ-DÉPLOIEMENT (lecture seule)
 * ============================================================================
 *
 * OBJECTIF
 * --------
 * Répondre par un OUI ou un NON factuel à la question :
 *   « si je déclenche le déploiement, les migrations vont-elles passer ? »
 *
 * Sans cet outil, la réponse est unknowable jusqu'au moment où le conteneur
 * refuse de démarrer en production — c'est-à-dire trop tard.
 *
 * PRINCIPE
 * --------
 * Ce script n'exécute AUCUNE écriture. Il ne fait que :
 *   - lire information_schema (tables, colonnes, index),
 *   - lire le registre schema_migrations s'il existe,
 *   - compter les valeurs en double qui empecheraient une contrainte UNIQUE.
 *
 * Il peut donc être branché sur la production avec un compte en lecture seule,
 * ou sur une simple copie de la production.
 *
 * CODE DE SORTIE
 * -------------
 *   0 → aucun bloqueur : le déploiement peut être tenté
 *   1 → au moins un bloqueur : le déploiement ÉCHOUERA
 *   2 → erreur technique (connexion, fichier introuvable)
 *
 * UTILISATION
 * -----------
 *   node scripts/check-migrations-readiness.cjs
 *
 * (npm : voir le script `db:migrate:check`)
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const { extractArrayBlock, parseObjectLiterals } = require('./generate-migrations-from-sources.cjs');

const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR
  ? path.resolve(process.env.MIGRATIONS_DIR)
  : path.join(ROOT, 'migrations');
const REFERENCE_DATA_TS = path.join(ROOT, 'src', 'core', 'data', 'reference-data.ts');
const UNIQUE_INDEXES_TS = path.join(ROOT, 'src', 'core', 'helpers', 'ensureUniqueIndexes.ts');

const CONNECT_ATTEMPTS = parseInt(process.env.MIGRATIONS_CONNECT_ATTEMPTS || '10', 10);
const CONNECT_RETRY_MS = parseInt(process.env.MIGRATIONS_CONNECT_RETRY_MS || '3000', 10);

/**
 * Colonnes exigées par 002_reference_data_autorisations.sql.
 * Si l'une manque, la migration échoue immédiatement (Unknown column).
 */
const REQUIRED_SCHEMA = {
  aut_roles: ['id', 'nom', 'description', 'createdAt', 'updatedAt', 'deletedAt'],
  aut_permissions: [
    'id',
    'key',
    'libelle',
    'module',
    'type',
    'parentKey',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ],
  aut_role_permissions: ['id', 'roleId', 'permissionId', 'createdAt', 'updatedAt'],
};

const blockers = [];
const warnings = [];

// ─── Présentation ────────────────────────────────────────────────────────────

const OK = '  [OK]      ';
const KO = '  [BLOQUANT]';
const WARN = '  [AVERT.]  ';
const INFO = '  ·         ';

function title(text) {
  console.log('');
  console.log(text);
  console.log('-'.repeat(Math.max(text.length, 62)));
}

// ─── Connexion ───────────────────────────────────────────────────────────────

async function connect() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'easyecole',
    charset: process.env.DB_CHARSET || 'utf8mb4_general_ci',
    connectTimeout: 10000,
  };

  let lastError;
  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    try {
      return await mysql.createConnection(config);
    } catch (err) {
      lastError = err;
      if (attempt < CONNECT_ATTEMPTS) {
        console.log(`  · connexion ${attempt}/${CONNECT_ATTEMPTS} échouée, nouvelle tentative…`);
        await new Promise((r) => setTimeout(r, CONNECT_RETRY_MS));
      }
    }
  }
  throw lastError;
}

// ─── Chargement des sources ──────────────────────────────────────────────────

function loadIndexDefinitions() {
  const source = fs.readFileSync(UNIQUE_INDEXES_TS, 'utf8');
  return {
    unique: parseObjectLiterals(extractArrayBlock(source, 'UNIQUE_INDEX_DEFS')),
    performance: parseObjectLiterals(extractArrayBlock(source, 'PERFORMANCE_INDEX_DEFS')),
  };
}

function loadMigrationNames() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();
}

// ─── Contrôles ───────────────────────────────────────────────────────────────

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return Number(rows[0].n) === 1;
}

async function listColumns(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return new Set(rows.map((r) => r.COLUMN_NAME));
}

/** Un index UNIQUE porte-t-il déjà, seul en tête de liste, sur cette colonne ? */
async function hasSingleColumnUniqueIndex(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME
       FROM information_schema.statistics
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND NON_UNIQUE = 0
      GROUP BY INDEX_NAME
     HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = ?`,
    [table, column]
  );
  return rows.length > 0;
}

/**
 * Détecte ce qui ferait échouer `CREATE UNIQUE INDEX` :
 *   - valeurs en double (2 lignes ou plus avec la même valeur),
 *   - chaîne vide répétée (MySQL n'autorise qu'une seule '').
 * NULL est exclu : MySQL autorise plusieurs NULL dans un index UNIQUE.
 */
async function findDuplicateValues(conn, table, column) {
  const quotedCol = `\`${column}\``;
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS groupes, COALESCE(SUM(n), 0) AS lignes
       FROM (
         SELECT COUNT(*) AS n
           FROM \`${table}\`
          WHERE ${quotedCol} IS NOT NULL
          GROUP BY ${quotedCol}
         HAVING COUNT(*) > 1
       ) d`,
    []
  );
  return {
    groupes: Number(rows[0].groupes),
    lignes: Number(rows[0].lignes),
  };
}

async function findEmptyStringCount(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${column}\` = ''`
  );
  return Number(rows[0].n);
}

async function isIndexCovered(conn, table, columns) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME,
            GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
       FROM information_schema.statistics
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      GROUP BY INDEX_NAME`,
    [table]
  );
  const target = columns.join(',');
  return rows.some((r) => r.cols === target || String(r.cols).startsWith(`${target},`));
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

async function main() {
  const dbName = process.env.DB_NAME || 'easyecole';
  const host = process.env.DB_HOST || 'localhost';

  console.log('');
  console.log('============================================================================');
  console.log(' AUDIT PRÉ-DÉPLOIEMENT — migrations (lecture seule, aucune écriture)');
  console.log('============================================================================');
  console.log(` Cible : ${process.env.DB_USER || 'root'}@${host}/${dbName}`);
  console.log(` Migrations : ${MIGRATIONS_DIR}`);
  console.log('');
  console.log(' Avertissement : cet outil lit la structure ET compte des valeurs en double.');
  console.log(' Sur une base volumineuse, le comptage peut prendre quelques minutes.');

  const conn = await connect();
  console.log(' Connexion établie.');
  console.log('');

  try {
    // ── 1. Migrations en attente
    title('1. MIGRATIONS');

    const migrationFiles = loadMigrationNames();
    if (migrationFiles.length === 0) {
      blockers.push('Aucune migration trouvée dans le dossier.');
      console.log(KO + 'aucune migration à appliquer.');
    } else {
      let applied = new Map();
      const registryExists = await tableExists(conn, 'schema_migrations');
      if (registryExists) {
        const [rows] = await conn.query('SELECT name, applied_at FROM schema_migrations');
        applied = new Map(rows.map((r) => [r.name, r.applied_at]));
        console.log(INFO + `registre schema_migrations : ${rows.length} migration(s) déjà appliquée(s).`);
      } else {
        warnings.push(
          'Le registre schema_migrations est absent : il s\'ira de la première exécution du runner.'
        );
        console.log(WARN + 'registre schema_migrations absent (première exécution).');
      }

      const pending = migrationFiles.filter((f) => !applied.has(f));
      for (const file of migrationFiles) {
        if (applied.has(file)) {
          console.log(OK + `${file} (déjà appliquée le ${applied.get(file)})`);
        } else {
          console.log(`${INFO} EN ATTENTE  ${file}`);
        }
      }
      if (pending.length === 0) {
        console.log('');
        console.log(INFO + 'Aucune migration en attente.');
      } else {
        console.log('');
        console.log(INFO + `${pending.length} migration(s) seront appliquées au prochain déploiement.`);
      }
    }

    // ── 2. Prérequis de la migration des données de référence
    title('2. PRÉREQUIS — données de référence (rôles / permissions)');

    for (const [table, columns] of Object.entries(REQUIRED_SCHEMA)) {
      const exists = await tableExists(conn, table);
      if (!exists) {
        const message = `table ${table} absente — la migration des données de référence échouera`;
        blockers.push(message);
        console.log(KO + message);
        continue;
      }
      const present = await listColumns(conn, table);
      const missing = columns.filter((c) => !present.has(c));
      if (missing.length > 0) {
        const message = `${table} : colonne(s) manquante(s) ${missing.join(', ')}`;
        blockers.push(message);
        console.log(KO + message);
      } else {
        console.log(OK + `${table} — ${columns.length} colonne(s) requise(s) présente(s).`);
      }
    }

    // ── 3. Contraintes d'unicité
    title('3. CONTRAINTES D\'UNICITÉ — le risque principal de déploiement');

    const { unique } = loadIndexDefinitions();
    console.log(INFO + `analyse de ${unique.length} contraintes d'unicité…`);
    console.log('');

    let conflicts = 0;
    let skipped = 0;

    for (const def of unique) {
      const { table, column } = def;
      const label = `${table}.${column}`;

      if (!(await tableExists(conn, table))) {
        warnings.push(`${label} : table absente en base, index ignoré par la migration.`);
        console.log(WARN + `${label} — table absente (migration : ignoré, pas bloquant).`);
        continue;
      }

      const present = await listColumns(conn, table);
      if (!present.has(column)) {
        warnings.push(`${label} : colonne absente en base, index ignoré par la migration.`);
        console.log(WARN + `${label} — colonne absente (migration : ignoré, pas bloquant).`);
        continue;
      }

      if (await hasSingleColumnUniqueIndex(conn, table, column)) {
        skipped++;
        continue;
      }

      const dup = await findDuplicateValues(conn, table, column);
      const emptyCount = await findEmptyStringCount(conn, table, column);

      if (dup.groupes > 0 || emptyCount > 1) {
        conflicts++;
        const details = [];
        if (dup.groupes > 0) {
          details.push(`${dup.lignes} lignes sur ${dup.groupes} valeur(s) en double`);
        }
        if (emptyCount > 1) {
          details.push(`${emptyCount} lignes avec la chaîne vide ''`);
        }
        const message = `${label} : ${details.join(' ; ')} — CREATE UNIQUE INDEX échouera`;
        blockers.push(message);
        console.log(KO + message);
      }
    }

    if (conflicts === 0) {
      console.log('');
      console.log(OK + `aucun conflit de doublons sur les ${unique.length} contraintes analysées.`);
    } else {
      console.log('');
      console.log(KO + `${conflicts} contrainte(s).unique(s) bloquante(s) sur ${unique.length} analysées.`);
    }
    if (skipped > 0) {
      console.log(INFO + `${skipped} contrainte(s) déjà couverte(s) par un index UNIQUE existant.`);
    }

    // ── 4. Index de performance
    title('4. INDEX DE PERFORMANCE');

    const { performance } = loadIndexDefinitions();
    let perfMissingTables = 0;
    for (const def of performance) {
      if (!(await tableExists(conn, def.table))) {
        perfMissingTables++;
        continue;
      }
      if (await isIndexCovered(conn, def.table, def.columns)) continue;
    }
    if (perfMissingTables > 0) {
      console.log(WARN + `${perfMissingTables} index(es) de performance ignorés (table absente).`);
    } else {
      console.log(OK + `les ${performance.length} index(es) de performance sont applicables sans risque.`);
    }

    // ── 5. Verdict
    title('5. VERDICT');

    if (blockers.length > 0) {
      console.log(' DEPLOIEMENT BLOQUE — les migrations échoueront.');
      console.log('');
      blockers.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
      console.log('');
      console.log(' Le conteneur refusera de démarrer (comportement voulu : mieux vaut un');
      console.log(' déploiement interrompu qu\'une base incohérente).');
    } else {
      console.log(' DEPLOIEMENT SANS BLOCAGE DETECTE.');
      if (warnings.length > 0) {
        console.log('');
        console.log(' Réserves mineures :');
        warnings.forEach((w) => console.log(`   · ${w}`));
      }
    }

    console.log('');
    console.log('============================================================================');
    console.log('');
    return blockers.length > 0 ? 1 : 0;
  } finally {
    await conn.end();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error(' Audit impossible :', err.message);
    console.error('');
    process.exit(2);
  });

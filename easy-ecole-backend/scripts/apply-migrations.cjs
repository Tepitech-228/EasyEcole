#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ============================================================================
 * apply-migrations.cjs — Runner de migrations SQL (EasyEcole)
 * ============================================================================
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * L'infrastructure de migrations était spécifiée dans `docker-entrypoint.sh`
 * (`node /app/scripts/apply-migrations.cjs || exit 1`) mais le runner lui-même
 * n'existait pas dans le dépôt : les migrations étaient censées être MONTÉES
 * EN VOLUME manuellement dans Dokploy à chaque déploiement. C'était la source
 * de la « gymnastique » et des schémas partiels.
 *
 * CE QUE FAIT CE SCRIPT
 * ---------------------
 *  1. Connexion MySQL avec tentatives (le conteneur backend peut démarrer
 *     avant MySQL).
 *  2. Création de la base si absente (non bloquant : la base peut être
 *     provisionnée en amont par Dokploy).
 *  3. Création de la table de suivi `schema_migrations`.
 *  4. Prise d'un verrou anti-concurrence (GET_LOCK) : deux conteneurs qui
 *     démarrent en même temps ne peuvent pas appliquer deux fois la même
 *     migration.
 *  5. Découverte des fichiers `migrations/*.sql`, triés par nom.
 *  6. Pour chaque migration :
 *       - si déjà appliquée ET checksum identique  -> ignorée
 *       - si déjà appliquée ET checksum DIFFÉRENT  -> ÉCHEC FATAL
 *         (une migration modifiée après coup est interdite : elle rend le
 *          schéma non reproductible)
 *       - sinon -> exécution des instructions, puis enregistrement.
 *  7. Échec d'une migration -> sortie en code 1 (fail-fast attendu par
 *     l'entrypoint : le déploiement est marqué en échec).
 *
 * CONTRAINTES
 * -----------
 *  - CommonJS exécutable par `node` seul : ni babel, ni ts-node.
 *  - ZÉRO nouvelle dépendance npm (mysql2 est déjà en `dependencies`).
 *  - L'image de production est construite avec `npm ci --omit=dev`.
 *
 * LIMITES ASSUMÉES (à connaître)
 * -----------------------------
 *  - MySQL effectue un COMMIT IMPLICITE sur les DDL (CREATE/ALTER/DROP/RENAME).
 *    Une transaction ne peut donc PAS annuler un ALTER déjà exécuté. Le runner
 *    ouvre malgré tout une transaction par migration : elle protège les
 *    migrations purement DML (INSERT/UPDATE) et garantit l'atomicité de
 *    l'enregistrement dans `schema_migrations` tant qu'aucun DDL n'est passé.
 *    En cas d'échec sur une migration à dominante DDL, la base peut être
 *    partiellement modifiée : c'est précisément pourquoi ces migrations sont
 *    écrites pour être ré-essayables (idempotentes).
 *  - Un fichier .sql = UNE migration logique.
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

// ─── Configuration ───────────────────────────────────────────────────────────

const REPOSITORY_MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'migrations');
const RUNTIME_MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR
  ? path.resolve(process.env.MIGRATIONS_DIR)
  : fs.existsSync(REPOSITORY_MIGRATIONS_DIR)
    ? REPOSITORY_MIGRATIONS_DIR
    : RUNTIME_MIGRATIONS_DIR;
const DB_NAME = process.env.DB_NAME || 'easyecole';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_LOGGING = process.env.DB_LOGGING === 'true';

const CONNECT_ATTEMPTS = parseInt(process.env.MIGRATIONS_CONNECT_ATTEMPTS || '10', 10);
const CONNECT_RETRY_MS = parseInt(process.env.MIGRATIONS_CONNECT_RETRY_MS || '3000', 10);
const LOCK_NAME = 'easyecole_schema_migrations';
const LOCK_TIMEOUT_SECONDS = 30;

/**
 * Charset de la connexion.
 * On reste en utf8mb3 (équivalent historique de `utf8`) car le schéma du projet
 * est en utf8mb3_general_ci (cf. src/core/helpers/DatabaseConnection.ts l. 76).
 * Une migration ne doit donc pas introduire de caractères 4 octets (emoji) :
 * ils seraient rejetés par les colonnes utf8mb3.
 */
const DB_CHARSET = process.env.DB_CHARSET || 'utf8mb4_general_ci';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Découpe un fichier .sql en instructions exécutables.
 * Gère les commentaires ligne (double tiret) et bloc (slash-etoile),
 * les chaînes '...' et "...", et les identifiants `...`.
 * Le découpage se fait sur les `;` de fin d'instruction.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Commentaire ligne -- (hors chaîne)
    if (!inSingle && !inDouble && !inBacktick && ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      current += '\n';
      continue;
    }

    // Commentaire bloc /* ... */
    if (!inSingle && !inDouble && !inBacktick && ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      current += ' ';
      continue;
    }

    // Échappement dans une chaîne
    if ((inSingle || inDouble) && ch === '\\') {
      current += ch + (next || '');
      i += 2;
      continue;
    }

    if (ch === "'" && !inDouble && !inBacktick) inSingle = !inSingle;
    else if (ch === '"' && !inSingle && !inBacktick) inDouble = !inDouble;
    else if (ch === '`' && !inSingle && !inDouble) inBacktick = !inBacktick;

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function log(...args) {
  console.log('[migrations]', ...args);
}

function logError(...args) {
  console.error('[migrations][ERREUR]', ...args);
}

// ─── Connexion ───────────────────────────────────────────────────────────────

/**
 * Sémantique SSL alignée sur src/core/helpers/DatabaseConnection.ts (l. 61-70) :
 *  - DB_SSL=off      -> pas de TLS (MySQL en conteneur, certificat auto-signé)
 *  - DB_SSL=require  -> TLS activé
 *  - undefined       -> TLS activé en production, désactivé ailleurs
 */
function buildSslOptions() {
  const dbSsl = process.env.DB_SSL || (NODE_ENV === 'production' ? 'require' : 'off');
  if (dbSsl === 'off') return undefined;
  if (dbSsl === 'require') return { rejectUnauthorized: false };
  return undefined;
}

async function connectWithRetry() {
  const ssl = buildSslOptions();
  let lastError = null;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    try {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        // Connexion au SERVEUR (base vide possible) : c'est nécessaire pour
        // pouvoir créer la base si elle n'existe pas encore.
        multipleStatements: false,
        ssl,
        connectTimeout: 10000,
        charset: DB_CHARSET,
      });
      log(`connecté à ${DB_HOST}:${DB_PORT} (base=${DB_NAME}, tentative ${attempt}/${CONNECT_ATTEMPTS})`);
      return connection;
    } catch (err) {
      lastError = err;
      if (attempt < CONNECT_ATTEMPTS) {
        log(
          `connexion impossible (${err.code || err.message}) — ` +
            `nouvelle tentative dans ${CONNECT_RETRY_MS} ms ` +
            `(${attempt}/${CONNECT_ATTEMPTS})`
        );
        await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_MS));
      }
    }
  }

  throw new Error(
    `Impossible de se connecter à MySQL ${DB_HOST}:${DB_PORT} après ${CONNECT_ATTEMPTS} tentatives : ` +
      `${lastError && (lastError.code || lastError.message)}`
  );
}

async function ensureDatabaseExists(connection) {
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci`
    );
    log(`base \`${DB_NAME}\` disponible`);
  } catch (err) {
    // Non bloquant : la base peut être provisionnée en amont (Dokploy) et le
    // compte applicatif n'a pas forcément le droit de la créer.
    log(`base \`${DB_NAME}\` non créée (non bloquant) : ${err.code || err.message}`);
  }
}

const SCHEMA_MIGRATIONS = 'schema_migrations';
const LEGACY_BACKUP = 'schema_migrations_legacy';

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return rows && rows[0] && rows[0].n === 1;
}

/**
 * Les anciennes installations Applicant une migration à la fois via
 * src/core/scripts/apply-migration-temp.ts, qui crée sa table de suivi avec des
 * colonnes en français : `nom`, `appliquee_le`, `duree_ms`. Le `CREATE TABLE IF
 * NOT EXISTS` du runner est alors un no-op et le `SELECT name, checksum` échoue
 * sur « Champ 'name' inconnu dans SELECT » : aucune migration ne peut plus
 * jamais être appliquée. C'est l'état dans lequel se trouvait la base de dev,
 * avec 026→029 bloquées depuis le 2026-09-22.
 *
 * On détecte cette forme et on convertit en place. La table legacy est
 * conservée sous `schema_migrations_legacy` : la conversion est réversible et
 * l'historique n'est jamais détruit.
 */
async function needsLegacyUpgrade(connection) {
  if (!(await tableExists(connection, SCHEMA_MIGRATIONS))) return false;
  const [cols] = await connection.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [SCHEMA_MIGRATIONS]
  );
  const names = cols.map((c) => c.COLUMN_NAME);
  return names.includes('nom') && !names.includes('name');
}

async function createMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${SCHEMA_MIGRATIONS}\` (
      \`name\`        VARCHAR(191) NOT NULL,
      \`checksum\`    VARCHAR(64)  NOT NULL,
      \`applied_at\`  DATETIME     NOT NULL,
      \`duration_ms\` INT         NULL,
      PRIMARY KEY (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci
  `);
}

async function upgradeLegacyMigrationsTable(connection, migrationsByName) {
  if (await tableExists(connection, LEGACY_BACKUP)) {
    logError(
      `la table \`${LEGACY_BACKUP}\` existe déjà : une conversion précédente a été ` +
      `interrompue. Inspectez-la avant de relancer (elle contient l'historique ` +
      `d'origine, nom/appliquee_le/duree_ms).`
    );
    process.exit(1);
  }

  const [legacyRows] = await connection.query(
    `SELECT \`nom\`, \`appliquee_le\`, \`duree_ms\` FROM \`${SCHEMA_MIGRATIONS}\``
  );
  log(
    `table \`${SCHEMA_MIGRATIONS}\` au format legacy détectée ` +
    `(${legacyRows.length} migration(s) déjà appliquée(s)) — conversion en place`
  );

  await connection.query(`RENAME TABLE \`${SCHEMA_MIGRATIONS}\` TO \`${LEGACY_BACKUP}\``);
  await createMigrationsTable(connection);

  let carried = 0;
  let orphans = [];
  for (const row of legacyRows) {
    const migration = migrationsByName.get(row.nom);
    if (!migration) {
      // Fichier absent du dépôt : le recopier déclencherait un rejeu, et son
      // contenu n'est plus disponible pour être rejoué de façon idempotente.
      // On l'ignore — et on le signale, car cela signifie que le dépôt a été
      // amputé d'une migration déjà passée en base.
      orphans.push(row.nom);
      continue;
    }
    await connection.query(
      `INSERT INTO \`${SCHEMA_MIGRATIONS}\` (\`name\`, \`checksum\`, \`applied_at\`, \`duration_ms\`) VALUES (?, ?, ?, ?)`,
      [row.nom, migration.checksum, row.appliquee_le, row.duree_ms === null ? null : row.duree_ms]
    );
    carried++;
  }

  log(`  ${carried} migration(s) reprise(s) avec leur empreinte recalculée sur disque`);
  if (orphans.length > 0) {
    logError(
      `  ${orphans.length} migration(s) de l'historique legacy n'existent plus sur disque ` +
      `et n'ont pas pu être reprises : ${orphans.join(', ')}`
    );
  }
  log(`  historique d'origine conservé dans \`${LEGACY_BACKUP}\``);
}

async function ensureMigrationsTable(connection, migrationsByName) {
  const legacy = await needsLegacyUpgrade(connection);
  if (legacy) {
    await upgradeLegacyMigrationsTable(connection, migrationsByName);
    return;
  }
  await createMigrationsTable(connection);
  log(`table de suivi \`${SCHEMA_MIGRATIONS}\` prête`);
}

// ─── Arguments de la ligne de commande ──────────────────────────────────────

/**
 * Options documentées en tête de fichier :
 *   (aucun)              toutes les migrations non appliquées
 *   8 15                 migrations 008 → 015 uniquement
 *   --force              rejoue aussi celles déjà appliquées
 *   --dry-run            liste ce qui serait exécuté, sans rien écrire
 *
 * L'implémentation d'origine ignorait argv : `--dry-run` ne faisait rien et
 * appliquait les migrations. C'est ce qui a permis à 026→029 de rester
 * non appliquées sans que personne ne s'en aperçoive.
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { dryRun: false, force: false, from: null, to: null, errors: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (/^\d+$/.test(arg)) {
      const n = parseInt(arg, 10);
      if (opts.from === null) opts.from = n;
      else if (opts.to === null) opts.to = n;
      else opts.errors.push(`argument numérique inattendu : ${arg}`);
    } else {
      opts.errors.push(`option inconnue : ${arg}`);
    }
  }

  if (opts.from !== null && opts.to !== null && opts.to < opts.from) {
    opts.errors.push(`plage invalide : ${opts.from} → ${opts.to}`);
  }
  return opts;
}

function usage() {
  log('usage : node scripts/apply-migrations.cjs [debut] [fin] [--force] [--dry-run]');
  log('  node scripts/apply-migrations.cjs              # toutes les migrations non appliquées');
  log('  node scripts/apply-migrations.cjs 8 15         # migrations 008 → 015 uniquement');
  log('  node scripts/apply-migrations.cjs --force      # rejoue aussi les déjà appliquées');
  log('  node scripts/apply-migrations.cjs --dry-run    # liste, sans exécuter');
}

// ─── Découverte des migrations ───────────────────────────────────────────────

/**
 * Numéro de séquence d'un nom de migration (`027_correction...` -> 27).
 * Retourne null si le nom ne commence pas par un nombre.
 */
function migrationNumber(name) {
  const match = /^(\d+)/.exec(name);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * `from` / `to` filtrent sur le numéro de séquence. Les migrations sans numéro
 * (nom non calibré) sont exclues dès qu'une borne est fournie : une plage
 * « 26 → 29 » ne doit pas embarquer par surprise un fichier `seed_*.sql`.
 */
function discoverMigrations(opts = {}) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logError(`dossier de migrations introuvable : ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const { from = null, to = null } = opts;

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();

  return files
    .filter((name) => {
      if (from === null && to === null) return true;
      const n = migrationNumber(name);
      if (n === null) return false;
      if (from !== null && n < from) return false;
      if (to !== null && n > to) return false;
      return true;
    })
    .map((name) => {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
      return {
        name,
        path: path.join(MIGRATIONS_DIR, name),
        content,
        checksum: sha256(content),
      };
    });
}

// ─── Exécution ───────────────────────────────────────────────────────────────

async function acquireLock(connection) {
  const [rows] = await connection.query('SELECT GET_LOCK(?, ?) AS acquired', [
    LOCK_NAME,
    LOCK_TIMEOUT_SECONDS,
  ]);
  const acquired = rows && rows[0] && rows[0].acquired === 1;
  if (!acquired) {
    logError(
      `impossible d'obtenir le verrou '${LOCK_NAME}' (${LOCK_TIMEOUT_SECONDS}s). ` +
        `Une autre instance applique peut-être déjà les migrations.`
    );
    process.exit(1);
  }
  log(`verrou '${LOCK_NAME}' obtenu`);
}

async function releaseLock(connection) {
  try {
    await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]);
    log(`verrou '${LOCK_NAME}' libéré`);
  } catch (err) {
    logError(`libération du verrou impossible : ${err.message}`);
  }
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT `name`, `checksum` FROM `schema_migrations`');
  return new Map(rows.map((row) => [row.name, row.checksum]));
}

async function applyMigration(connection, migration) {
  const statements = splitSqlStatements(migration.content);
  const startedAt = Date.now();

  if (DB_LOGGING) {
    log(`${migration.name} — ${statements.length} instruction(s)`);
  }

  // ⚠️ MySQL commit implicitement les DDL : cette transaction protège les
  // migrations DML et l'enregistrement, pas les ALTER déjà exécutés.
  await connection.query('START TRANSACTION');
  try {
    for (const statement of statements) {
      if (DB_LOGGING) {
        log(`  > ${statement.replace(/\s+/g, ' ').slice(0, 160)}`);
      }
      await connection.query(statement);
    }

    const duration = Date.now() - startedAt;
    // ON DUPLICATE KEY : `--force` rejoue une migration déjà enregistrée, ce qui
    // violerait la clé primaire `name`.
    await connection.query(
      'INSERT INTO `schema_migrations` (`name`, `checksum`, `applied_at`, `duration_ms`) VALUES (?, ?, NOW(), ?) ' +
        'ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`), `applied_at` = VALUES(`applied_at`), ' +
        '`duration_ms` = VALUES(`duration_ms`)',
      [migration.name, migration.checksum, duration]
    );
    await connection.query('COMMIT');
    return duration;
  } catch (err) {
    await connection.query('ROLLBACK').catch(() => undefined);
    throw err;
  }
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────

async function main() {
  if (DB_DIALECT !== 'mysql') {
    logError(`dialecte non supporté par le runner de migrations : ${DB_DIALECT}`);
    process.exit(1);
  }

  if (NODE_ENV === 'production' && DB_USER === 'root' && process.env.ALLOW_DB_ROOT !== 'true') {
    logError(
      'refus de se connecter en root en production. ' +
        'Utilisez un compte dédié (DB_USER) ou ALLOW_DB_ROOT=true en exception d’urgence.'
    );
    process.exit(1);
  }

  const opts = parseArgs(process.argv);
  if (opts.help) {
    usage();
    process.exit(0);
  }
  if (opts.errors.length > 0) {
    opts.errors.forEach((e) => logError(e));
    usage();
    process.exit(1);
  }

  const migrations = discoverMigrations(opts);
  if (migrations.length === 0) {
    log('aucune migration à appliquer');
  }

  const connection = await connectWithRetry();
  let exitCode = 0;

  try {
    await ensureDatabaseExists(connection);
    await connection.query(`USE \`${DB_NAME}\``);

    if (opts.dryRun) {
      // Lecture seule : ni la table de suivi ni la conversion legacy ne sont
      // touchées, sinon « vérifier avant d'agir » modifierait la base.
      const appliedNames = new Set();

      if (await tableExists(connection, SCHEMA_MIGRATIONS)) {
        const legacy = await needsLegacyUpgrade(connection);
        const column = legacy ? 'nom' : 'name';
        const [rows] = await connection.query(
          `SELECT \`${column}\` AS migration_name FROM \`${SCHEMA_MIGRATIONS}\``
        );
        rows.forEach((r) => appliedNames.add(r.migration_name));
        if (legacy) {
          log(`attention : \`${SCHEMA_MIGRATIONS}\` est au format legacy — sera convertie à l'application`);
        }
      }

      const toApply = migrations.filter((m) => !appliedNames.has(m.name));
      log('———————————————————————————————————————————');
      log('MODE DRY-RUN — aucune modification ne sera écrite');
      log(`dossier de migrations   : ${MIGRATIONS_DIR}`);
      log(`migrations découvertes  : ${migrations.length}`);
      log(`déjà appliquées        : ${migrations.length - toApply.length}`);
      log('à appliquer            :');
      toApply.forEach((m) => log(`  + ${m.name}`));
      log('———————————————————————————————————————————');
      return;
    }

    await ensureMigrationsTable(
      connection,
      new Map(migrations.map((m) => [m.name, m]))
    );
    await acquireLock(connection);

    const applied = await getAppliedMigrations(connection);
    const summary = { applied: [], alreadyApplied: [], unchanged: 0, replayed: 0 };

    for (const migration of migrations) {
      const knownChecksum = applied.get(migration.name);

      if (knownChecksum !== undefined && !opts.force) {
        if (knownChecksum !== migration.checksum) {
          logError(
            `MIGRATION MODIFIÉE APRÈS APPLICATION : ${migration.name}\n` +
              `  empreinte en base  : ${knownChecksum}\n` +
              `  empreinte sur disque: ${migration.checksum}\n` +
              `Une migration déjà appliquée ne doit plus être éditée. ` +
              `Créez une nouvelle migration corrective.`
          );
          exitCode = 1;
          break;
        }
        summary.alreadyApplied.push(migration.name);
        summary.unchanged++;
        continue;
      }

      try {
        const duration = await applyMigration(connection, migration);
        summary.applied.push(migration.name);
        if (knownChecksum !== undefined) summary.replayed++;
        log(`✔ ${migration.name} appliquée (${duration} ms)`);
      } catch (err) {
        logError(`échec de la migration ${migration.name} :`);
        logError(`  code    : ${err.code || '-'}`);
        logError(`  message : ${err.message}`);
        logError(
          '  La migration a été interrompue. Le déploiement est arrêté ' +
            '(comportement fail-fast) : aucune donnée n\'est conservée dans un état incohérent ' +
            'que si la migration contient des DDL non ré-essayables — voir les limites documentées ' +
            'en tête de scripts/apply-migrations.cjs.'
        );
        exitCode = 1;
        break;
      }
    }

    // Version du schéma = dernière migration appliquée
    const [lastRows] = await connection.query(
      'SELECT `name`, `applied_at` FROM `schema_migrations` ORDER BY `applied_at` DESC, `name` DESC LIMIT 1'
    );
    const last = lastRows && lastRows[0];

    log('———————————————————————————————————————————');
    log(`migrations appliquées       : ${summary.applied.length}`);
    summary.applied.forEach((n) => log(`  + ${n}`));
    if (summary.replayed > 0) {
      log(`  (dont ${summary.replayed} rejouée(s) via --force)`);
    }
    log(`migrations déjà présentes   : ${summary.alreadyApplied.length}`);
    log(`version du schéma           : ${last ? `${last.name} (${last.applied_at})` : 'aucune'}`);
    log('———————————————————————————————————————————');
  } finally {
    await releaseLock(connection).catch(() => undefined);
    await connection.end().catch(() => undefined);
  }

  process.exit(exitCode);
}

if (require.main === module) {
  main().catch((err) => {
    logError(err && err.stack ? err.stack : String(err));
    process.exit(1);
  });
}

// Exposé pour les tests unitaires du découpage SQL.
module.exports = { splitSqlStatements, discoverMigrations, sha256 };

#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ============================================================================
 * generate-migrations-from-sources.cjs — Génère les migrations SQL à partir
 *                                       des sources TypeScript du projet
 * ============================================================================
 *
 * POURQUOI UN GÉNÉRATEUR
 * ----------------------
 * Les listes de référence (permissions/rôles/liaisons) et les définitions
 * d'index vivent dans du TypeScript :
 *   - src/core/data/reference-data.ts
 *   - src/core/helpers/ensureUniqueIndexes.ts
 *
 * Ces listes étaient appliquées à chaque démarrage par des modules `ensure*`
 * non versionnés. On les fige dans des migrations SQL AUTONOMES : une migration
 * est un artefact figé, jamais recalculé au déploiement. Ce script est donc un
 * outil de MAINTENANCE (à exécuter quand on modifie une de ces listes), et non
 * une étape du pipeline de déploiement.
 *
 * ⚠️ RÈGLE ABSOLUE : une migration déjà appliquée ne doit JAMAIS être
 * modifiée (le runner détecte l divergence d'empreinte et bloque). Pour
 * ajouter des données, ce script doit produire un NOUVEAU fichier de migration
 * (numéro suivant), pas réécrire un fichier existant.
 *
 * UTILISATION
 * -----------
 *   node scripts/generate-migrations-from-sources.cjs
 *
 * (réutilisable via npm : voir le script `db:generate-migrations`)
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'migrations');
const REFERENCE_DATA_TS = path.join(ROOT, 'src', 'core', 'data', 'reference-data.ts');
const UNIQUE_INDEXES_TS = path.join(ROOT, 'src', 'core', 'helpers', 'ensureUniqueIndexes.ts');

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

/** Échappe une valeur pour une chaîne SQL (doublage des apostrophes). */
function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Extrait le corps d'un tableau exporté depuis un source TypeScript.
 * Exemple : `export const REF_ROLES: RefRole[] = [ ... ]`
 */
function extractArrayBlock(source, exportName) {
  const startRe = new RegExp(`export\\s+const\\s+${exportName}\\b[^=]*=\\s*\\[`);
  const match = startRe.exec(source);
  if (!match) {
    throw new Error(`tableau ${exportName} introuvable`);
  }
  const start = match.index + match[0].length;
  const end = source.indexOf('\n]', start);
  if (end === -1) {
    throw new Error(`fin du tableau ${exportName} introuvable`);
  }
  return source.slice(start, end);
}

/**
 * Parse un bloc d'objets littéraux `{ prop: 'value', prop2: null, prop3: ['a','b'] }`.
 * Gère les apostrophes échappées et les valeurs de type tableau.
 */
function parseObjectLiterals(block) {
  const objects = [];
  const objectRe = /\{([^{}]*)\}/g;
  let objectMatch;
  while ((objectMatch = objectRe.exec(block)) !== null) {
    const body = objectMatch[1];
    const props = {};
    // Valeur = tableau [...] | chaîne '...' | null
    const propRe = /(\w+)\s*:\s*(\[[^\]]*\]|'(?:[^'\\]|\\.)*'|null)/g;
    let propMatch;
    let hasProp = false;
    while ((propMatch = propRe.exec(body)) !== null) {
      hasProp = true;
      const raw = propMatch[2];
      if (raw === 'null') {
        props[propMatch[1]] = null;
      } else if (raw.startsWith('[')) {
        const items = [];
        const itemRe = /'(?:[^'\\]|\\.)*'/g;
        let itemMatch;
        while ((itemMatch = itemRe.exec(raw)) !== null) {
          items.push(itemMatch[0].slice(1, -1).replace(/\\'/g, "'"));
        }
        props[propMatch[1]] = items;
      } else {
        props[propMatch[1]] = raw.slice(1, -1).replace(/\\'/g, "'");
      }
    }
    if (hasProp) objects.push(props);
  }
  return objects;
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// ─── Génération : 002 — données de référence ─────────────────────────────────

function generateReferenceDataMigration(permissions, roles, rolePermissions) {
  const lines = [];

  lines.push('-- ============================================================================');
  lines.push('-- 002 — Données de référence : rôles, permissions et liaisons');
  lines.push('-- ============================================================================');
  lines.push('--');
  lines.push('-- GENERE par scripts/generate-migrations-from-sources.cjs');
  lines.push('-- Source  : src/core/data/reference-data.ts');
  lines.push('--');
  lines.push('-- Remplace le module src/core/helpers/ensureReferenceData.ts, qui appliquait');
  lines.push('-- ces mêmes listes à CHAQUE démarrage sans versionnement.');
  lines.push('--');
  lines.push(`-- Contenu : ${permissions.length} permissions, ${roles.length} rôles, ${rolePermissions.length} liaisons.`);
  lines.push('--');
  lines.push('-- IDEMPOTENCE :');
  lines.push('--  - permissions : résolution par la clé naturelle `key` (UNIQUE en base)');
  lines.push('--  - rôles       : résolution par `nom`');
  lines.push('--  - liaisons    : résolution par identifiants naturels + anti-doublon explicite');
  lines.push('-- Aucun DELETE : une migration ne détruit jamais de données.');
  lines.push('--');
  lines.push('-- Remarque MySQL : la fonction VALUES() est dépréciée depuis 8.0.20 au profit');
  lines.push('-- des alias de colonnes. Elle reste fonctionnelle ; elle est conservée ici pour');
  lines.push('-- garantir la compatibilité avec lesversions MySQL antérieures.');
  lines.push('-- ============================================================================');
  lines.push('');
  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('-- 1. RÔLES');
  lines.push('-- Pas de contrainte UNIQUE fiable sur aut_roles.nom : on fait un INSERT');
  lines.push('-- conditionné puis un UPDATE, comme dans ensureReferenceData.ts.');
  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('');

  for (const role of roles) {
    lines.push(`-- Rôle : ${role.nom}`);
    lines.push(
      `INSERT INTO \`aut_roles\` (\`nom\`, \`description\`, \`createdAt\`, \`updatedAt\`)` +
        `\nSELECT ${sql(role.nom)}, ${sql(role.description)}, NOW(), NOW() FROM DUAL` +
        `\nWHERE NOT EXISTS (SELECT 1 FROM \`aut_roles\` WHERE \`nom\` = ${sql(role.nom)});`
    );
    lines.push(
      `UPDATE \`aut_roles\` SET \`description\` = ${sql(role.description)}, \`deletedAt\` = NULL` +
        `\nWHERE \`nom\` = ${sql(role.nom)};`
    );
    lines.push('');
  }

  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('-- 2. PERMISSIONS');
  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('');

  for (const batch of chunk(permissions, 40)) {
    const values = batch
      .map(
        (p) =>
          `(${sql(p.key)}, ${sql(p.libelle)}, ${sql(p.module)}, ${sql(p.type)}, ${sql(p.parentKey)}, NOW(), NOW())`
      )
      .join(',\n  ');
    lines.push('INSERT INTO `aut_permissions`');
    lines.push('  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)');
    lines.push('VALUES');
    lines.push(`  ${values}`);
    lines.push('ON DUPLICATE KEY UPDATE');
    lines.push('  `libelle`    = VALUES(`libelle`),');
    lines.push('  `module`    = VALUES(`module`),');
    lines.push('  `type`      = VALUES(`type`),');
    lines.push('  `parentKey` = VALUES(`parentKey`),');
    lines.push('  `deletedAt` = NULL;');
    lines.push('');
  }

  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('-- 3. LIAISONS RÔLE ↔ PERMISSION');
  lines.push('--');
  lines.push('-- Le SELECT anti-doublon (`NOT EXISTS`) est délibéré : il rend la migration');
  lines.push('-- idempotente même si l\'index UNIQUE (roleId, permissionId) n\'existe pas');
  lines.push('-- encore en base. Garantir l\'idempotence par le schéma serait fragile ;');
  lines.push('-- on la garantit donc par la requête.');
  lines.push('--');
  lines.push('-- Si un rôle ou une permission référencée n\'existe pas, la liaison est');
  lines.push('-- simplement ignorée (0 ligne affectée) : la migration ne casse pas.');
  lines.push('-- ----------------------------------------------------------------------------');
  lines.push('');

  for (const rp of rolePermissions) {
    lines.push(
      `INSERT INTO \`aut_role_permissions\` (\`roleId\`, \`permissionId\`, \`createdAt\`, \`updatedAt\`)` +
        `\nSELECT r.id, p.id, NOW(), NOW()` +
        `\n  FROM \`aut_roles\` r` +
        `\n  JOIN \`aut_permissions\` p ON p.\`key\` = ${sql(rp.permissionKey)}` +
        `\n WHERE r.\`nom\` = ${sql(rp.roleNom)}` +
        `\n   AND NOT EXISTS (` +
        `\n     SELECT 1 FROM \`aut_role_permissions\` rp` +
        `\n      WHERE rp.\`roleId\` = r.id AND rp.\`permissionId\` = p.id` +
        `\n   )` +
        `\nLIMIT 1;`
    );
  }

  return lines.join('\n') + '\n';
}

// ─── Génération : 003 / 004 — index ──────────────────────────────────────────

/**
 * Émet une création d'index protégée (idempotence sans IF NOT EXISTS,
 * indisponible sur MySQL pour les index) via PREPARE / EXECUTE.
 *
 * @param {string} table
 * @param {string[]} columns
 * @param {boolean} unique
 * @param {string} guardCondition SQL renvoyant vrai si l'index doit être SAUTÉ
 * @param {number} index numéro d'ordre (nom du statement préparé)
 */
function emitCreateIndex({ table, columns, unique, guardCondition, seq }) {
  const indexName = `idx_${table}_${columns.join('_')}`.slice(0, 64);
  const colsList = columns.map((c) => `\`${c}\``).join(', ');
  const kind = unique ? 'UNIQUE ' : '';
  const ddl = `CREATE ${kind}INDEX \`${indexName}\` ON \`${table}\` (${colsList})`;

  return [
    `SET @ddl_${seq} := IF(`,
    `  (SELECT COUNT(*) FROM information_schema.TABLES`,
    `     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}') = 1`,
    `  AND NOT (${guardCondition}),`,
    `  ${sql(ddl)},`,
    `  'DO 0'`,
    `);`,
    `PREPARE stmt_${seq} FROM @ddl_${seq};`,
    `EXECUTE stmt_${seq};`,
    `DEALLOCATE PREPARE stmt_${seq};`,
  ].join('\n');
}

/** L'index existe-t-il déjà comme index UNIQUE mono-colonne sur cette colonne ? */
function uniqueIndexExistsGuard(table, column) {
  return `(
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table}'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = '${column}'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )`;
}

/** Un index existant couvre-t-il ces colonnes en tête ? (logique `isCovered`) */
function performanceIndexCoveredGuard(table, columns) {
  const cols = columns.join(',');
  return `(
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = '${table}'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = '${cols}' OR x.cols LIKE '${cols},%'
  ) > 0`;
}

function generateUniqueIndexesMigration(defs) {
  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- 003 — Index UNIQUE (contraintes d\'unicité)');
  lines.push('-- ============================================================================');
  lines.push('--');
  lines.push('-- GENERE par scripts/generate-migrations-from-sources.cjs');
  lines.push('-- Source  : UNIQUE_INDEX_DEFS (src/core/helpers/ensureUniqueIndexes.ts)');
  lines.push(`-- Contenu : ${defs.length} contraintes.`);
  lines.push('--');
  lines.push('-- Règle : ne créer l\'index que si AUCUN index UNIQUE mono-colonne n\'existe');
  lines.push('-- déjà sur (table, colonne). Un index UNIQUE composite n\'enferme pas');
  lines.push('-- l\'unicité d\'une colonne seule : il ne suffit donc pas.');
  lines.push('--');
  lines.push('-- ⚠️ NON REPRIS VOLONTAIREMENT : la fonction');
  lines.push('--    ensureUserPermissionCompositeIndex() (ensureUniqueIndexes.ts l. 142-158)');
  lines.push('-- qui déduplique aut_user_permissions par DELETE. Un DELETE est INTERDIT');
  lines.push('-- dans une migration. Ce point reste à traiter dans une migration dédiée');
  lines.push('-- après validation métier (données identiques ou non).');
  lines.push('--');
  lines.push('-- MySQL n\'a pas de CREATE INDEX IF NOT EXISTS : l\'idempotence est obtenue');
  lines.push('-- en interrogeant information_schema puis en construisant le DDL dynamiquement.');
  lines.push('-- ============================================================================');
  lines.push('');

  defs.forEach((def, i) => {
    const seq = i + 1;
    lines.push(`-- ${def.table}.${def.column}`);
    lines.push(
      emitCreateIndex({
        table: def.table,
        columns: [def.column],
        unique: true,
        guardCondition: uniqueIndexExistsGuard(def.table, def.column),
        seq,
      })
    );
    lines.push('');
  });

  return lines.join('\n') + '\n';
}

function generatePerformanceIndexesMigration(defs) {
  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- 004 — Index de performance (filtres et agrégations fréquents)');
  lines.push('-- ============================================================================');
  lines.push('--');
  lines.push('-- GENERE par scripts/generate-migrations-from-sources.cjs');
  lines.push('-- Source  : PERFORMANCE_INDEX_DEFS (src/core/helpers/ensureUniqueIndexes.ts)');
  lines.push(`-- Contenu : ${defs.length} index.`);
  lines.push('--');
  lines.push('-- Règle : un index existant dont les colonnes de tête couvrent la définition');
  lines.push('-- est conservé tel quel (logique `isCovered`).');
  lines.push('-- ============================================================================');
  lines.push('');

  defs.forEach((def, i) => {
    const seq = i + 1;
    lines.push(`-- ${def.table} (${def.columns.join(', ')})`);
    lines.push(
      emitCreateIndex({
        table: def.table,
        columns: def.columns,
        unique: false,
        guardCondition: performanceIndexCoveredGuard(def.table, def.columns),
        seq,
      })
    );
    lines.push('');
  });

  return lines.join('\n') + '\n';
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log(`[gen] dossier créé : ${MIGRATIONS_DIR}`);
  }

  // ── 002 : données de référence
  const refSource = read(REFERENCE_DATA_TS);
  const roles = parseObjectLiterals(extractArrayBlock(refSource, 'REF_ROLES'));
  const permissions = parseObjectLiterals(extractArrayBlock(refSource, 'REF_PERMISSIONS'));
  const rolePermissions = parseObjectLiterals(extractArrayBlock(refSource, 'REF_ROLE_PERMISSIONS'));

  const knownRoleNames = new Set(roles.map((r) => r.nom));
  const knownPermissionKeys = new Set(permissions.map((p) => p.key));

  const unknownRoles = [...new Set(rolePermissions.map((r) => r.roleNom))].filter(
    (n) => !knownRoleNames.has(n)
  );
  const unknownPermissions = [...new Set(rolePermissions.map((r) => r.permissionKey))].filter(
    (k) => !knownPermissionKeys.has(k)
  );

  if (unknownRoles.length) {
    console.warn(
      `[gen] ⚠ ${unknownRoles.length} rôle(s) référencé(s) dans REF_ROLE_PERMISSIONS mais ` +
        `absents de REF_ROLES (leurs liaisons seront ignorées par la base) : ${unknownRoles.join(', ')}`
    );
  }
  if (unknownPermissions.length) {
    console.warn(
      `[gen] ⚠ ${unknownPermissions.length} permission(s) référencée(s) dans ` +
        `REF_ROLE_PERMISSIONS mais absentes de REF_PERMISSIONS : ${unknownPermissions.join(', ')}`
    );
  }

  const orphanRoles = roles.filter((r) => !r.nom || !r.description === undefined);
  if (orphanRoles.length) {
    console.warn(`[gen] ⚠ ${orphanRoles.length} rôle(s) incomplet(s) dans REF_ROLES`);
  }

  const files = [
    {
      file: '002_reference_data_autorisations.sql',
      content: generateReferenceDataMigration(permissions, roles, rolePermissions),
    },
  ];

  // ── 003 / 004 : index
  const indexSource = read(UNIQUE_INDEXES_TS);
  const uniqueDefs = parseObjectLiterals(extractArrayBlock(indexSource, 'UNIQUE_INDEX_DEFS'));
  const perfDefs = parseObjectLiterals(extractArrayBlock(indexSource, 'PERFORMANCE_INDEX_DEFS'));

  files.push({
    file: '003_index_uniques.sql',
    content: generateUniqueIndexesMigration(uniqueDefs),
  });
  files.push({
    file: '004_index_performance.sql',
    content: generatePerformanceIndexesMigration(perfDefs),
  });

  for (const { file, content } of files) {
    const target = path.join(MIGRATIONS_DIR, file);
    const existed = fs.existsSync(target);
    fs.writeFileSync(target, content, 'utf8');
    console.log(
      `[gen] ${existed ? 'écrasé' : 'créé  '} ${file} (${content.length} octets)`
    );
  }

  console.log('[gen] terminé.');
  console.log('');
  console.log('[gen] ⚠ Ces fichiers sont des MIGRATIONS. Une fois appliquées, plus jamais modifiées.');
  console.log('[gen]   Pour de nouvelles données, incrémentez le numéro et régénérez.');
}

if (require.main === module) {
  main();
}

// Exposé pour réutilisation (notamment par scripts/check-migrations-readiness.cjs
// qui doit analyser les mêmes définitions sans régénérer de fichier).
module.exports = { extractArrayBlock, parseObjectLiterals };

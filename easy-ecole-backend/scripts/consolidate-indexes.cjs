/**
 * Consolidation des index MySQL (EasyEcole)
 * =========================================
 * Tables ciblées (atteignent/approchent le plafond InnoDB de 64 index) :
 *   aut_utilisateurs, aut_apprenants, aut_enseignants, eta_etablissements, cpt_exercices
 *
 * Modes :
 *   node scripts/consolidate-indexes.cjs           -> inventaire + backup JSON + DRY-RUN (aucune modification)
 *   node scripts/consolidate-indexes.cjs --apply   -> exécute les DROP INDEX proposés
 *
 * Script jetable : aucun fichier TS du projet n'est modifié.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
};

const TABLES = [
  'aut_utilisateurs',
  'aut_apprenants',
  'aut_enseignants',
  'eta_etablissements',
  'cpt_exercices',
];

// Noms d'index "propres" attendus par les modèles Sequelize (unique: true / named unique).
// -> à privilégier comme KEEP lors d'un doublon exact sans suffixe.
const MODEL_UNIQUE_NAMES = new Set([
  // aut_utilisateurs (Utilisateur.ts)
  'identifiant', 'email', 'nom-prenoms',
  // aut_apprenants (Apprenant.ts)
  'photo', 'qrCode', 'cni',
  // aut_enseignants (Enseignant.ts)
  'matricule',
  // eta_etablissements (Etablissement.ts)
  'code',
  // cpt_exercices (ExerciceComptable.ts)
]);

const SUFFIX_RE = /^(.*)_(\d+)$/;

// ---------------------------------------------------------------------------
// 1. Inventaire
// ---------------------------------------------------------------------------
async function loadIndexes(conn) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME,
            SUB_PART, INDEX_TYPE
       FROM information_schema.statistics
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    [DB.database, TABLES]
  );

  const perTable = {};
  for (const t of TABLES) perTable[t] = {};

  for (const row of rows) {
    const t = row.TABLE_NAME;
    if (!perTable[t]) perTable[t] = {};
    const idx = perTable[t][row.INDEX_NAME];
    if (!idx) {
      perTable[t][row.INDEX_NAME] = {
        name: row.INDEX_NAME,
        nonUnique: row.NON_UNIQUE === 1, // 0 = UNIQUE, 1 = non-unique
        indexType: row.INDEX_TYPE,
        columns: [],
      };
    }
    perTable[t][row.INDEX_NAME].columns.push({
      col: row.COLUMN_NAME,
      seq: row.SEQ_IN_INDEX,
      subPart: row.SUB_PART,
    });
  }

  // ordre de "création" : ordre d'apparition dans statistics (déterministe).
  return perTable;
}

// ---------------------------------------------------------------------------
// 2. Analyse des doublons (une table)
// ---------------------------------------------------------------------------
function signatureOf(index) {
  const cols = index.columns
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((c) => `${c.col}${c.subPart ? `(${c.subPart})` : ''}`)
    .join(',');
  return `${cols}::${index.indexType || 'BTREE'}::${index.nonUnique ? 'N' : 'U'}`;
}

function isFkIndex(name) {
  return /ibfk/i.test(name);
}

function isPrimary(name) {
  return name === 'PRIMARY';
}

function analyzeTable(tableName, indexMap) {
  const entries = Object.values(indexMap);

  // ---- groupe par signature (colonnes ordonnées + type + unicité)
  const groups = new Map();
  for (const idx of entries) {
    const sig = signatureOf(idx);
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(idx);
  }

  const keep = new Set();
  const drop = []; // { name, reason }

  for (const idx of entries) {
    if (isPrimary(idx.name) || isFkIndex(idx.name)) keep.add(idx.name);
  }

  for (const [sig, members] of groups) {
    if (members.length < 2) continue;

    // ---- règle a : suffixe "_2+" dont le base existe dans le même groupe
    const nameSet = new Set(members.map((m) => m.name));
    const suffixedNoBase = [];
    for (const m of members) {
      const mSuffix = SUFFIX_RE.exec(m.name);
      if (mSuffix && nameSet.has(mSuffix[1])) {
        // X_2+ duplique X (même signature garantie car même groupe)
        if (!isFkIndex(m.name)) {
          drop.push({ name: m.name, reason: `_2+ de ${mSuffix[1]} (même signature ${sig})` });
        }
        continue;
      }
      if (mSuffix && !nameSet.has(mSuffix[1])) {
        suffixedNoBase.push(m); // à traiter après (règle b ou signalement)
        continue;
      }
      keep.add(m.name);
    }

    // ---- règle b : doublons stricts restants + suffixés sans base
    const remaining = members.filter(
      (m) => !isFkIndex(m.name) && !drop.some((d) => d.name === m.name)
    );
    if (remaining.length <= 1) continue;

    // choix du gardé : convention Sequelize (nom = colonne ou nom unique connu) sinon plus ancien
    const scored = remaining.map((m) => {
      const cols = m.columns.slice().sort((a, b) => a.seq - b.seq).map((c) => c.col);
      const isConventional =
        (cols.length === 1 && m.name === cols[0]) ||
        MODEL_UNIQUE_NAMES.has(m.name);
      return { m, isConventional };
    });

    const keeper = scored.find((s) => s.isConventional) || scored[0];
    for (const s of scored) {
      if (s.m !== keeper.m) {
        drop.push({
          name: s.m.name,
          reason: `duplique ${keeper.m.name} (même signature ${sig})`,
        });
      }
    }
    keep.add(keeper.m.name);
  }

  // ---- index suffixés uniques SANS base : conservés + signalés
  const conservedSuffixedUnique = [];
  const m = entries.filter((i) => SUFFIX_RE.test(i.name));
  for (const idx of m) {
    const base = SUFFIX_RE.exec(idx.name)[1];
    if (!indexMap[base] && !idx.nonUnique) {
      conservedSuffixedUnique.push(idx.name);
    }
  }

  return {
    table: tableName,
    totalBefore: entries.length,
    totalAfter: entries.length - drop.length,
    keep: Array.from(keep),
    drop,
    conservedSuffixedUnique,
  };
}

// ---------------------------------------------------------------------------
// 3. Backup JSON
// ---------------------------------------------------------------------------
function isoStamp() {
  return new Date().toISOString().replace(/:/g, '-');
}

function writeBackup(perTable, analyses) {
  const dir = path.join(__dirname, '..', '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `indexes-avant-${isoStamp()}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    database: DB.database,
    tables: TABLES,
    stateAvant: perTable,
    analyses,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return file;
}

// ---------------------------------------------------------------------------
// 4. Exécution
// ---------------------------------------------------------------------------
async function applyDrop(conn, table, dropList) {
  const results = [];
  for (const d of dropList) {
    try {
      await conn.query(`ALTER TABLE \`${table}\` DROP INDEX \`${d.name}\``);
      results.push({ table, index: d.name, ok: true });
      console.log(`   ✔ DROP INDEX ${d.name} ON ${table}`);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.log(`   ✖ DROP INDEX ${d.name} ON ${table} -> ${msg}`);
      results.push({ table, index: d.name, ok: false, error: msg });
    }
  }
  return results;
}

async function countIndexes(conn, table) {
  const [r] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.statistics
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB.database, table]
  );
  // COUNT(*) sur statistics compte 1 ligne PAR colonne d'index -> redevable :
  // on compte les noms d'index distincts.
  const [r2] = await conn.query(
    `SELECT COUNT(DISTINCT INDEX_NAME) AS cnt FROM information_schema.statistics
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB.database, table]
  );
  return parseInt(r2[0].cnt, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const apply = process.argv.includes('--apply');
  const conn = await mysql.createConnection(DB);

  try {
    console.log('Connexion OK :', DB.host, DB.port, '/', DB.database);
    const perTable = await loadIndexes(conn);

    console.log('\n=== INVENTAIRE ===');
    for (const t of TABLES) {
      const names = Object.keys(perTable[t]);
      console.log(`${t.padEnd(22)} ${String(names.length).padStart(3)} index`);
    }

    const analyses = TABLES.map((t) => analyzeTable(t, perTable[t]));
    const backupFile = writeBackup(perTable, analyses);
    console.log('\nBackup AVANT écrit :', backupFile);

    console.log('\n=== DRY-RUN : DROP INDEX proposés ===');
    for (const a of analyses) {
      console.log(`\n[${a.table}]  ${a.totalBefore} -> ${a.totalAfter} index`);
      if (a.conservedSuffixedUnique.length) {
        console.log(
          `   ⚠ CONSERVÉS (uniques suffixés sans base, non supprimés) : ${a.conservedSuffixedUnique.join(', ')}`
        );
      }
      if (!a.drop.length) {
        console.log('   (aucun index redondant)');
      }
      for (const d of a.drop) {
        const idxDef = perTable[a.table][d.name];
        const cols = idxDef.columns
          .slice()
          .sort((x, y) => x.seq - y.seq)
          .map((c) => `${c.col}${c.subPart ? `(${c.subPart})` : ''}`)
          .join(', ');
        console.log(`   - ${a.table}.${d.name} [${cols}] ${idxDef.nonUnique ? '(non unique)' : '(UNIQUE)'} -> ${d.reason}`);
      }
    }

    if (!apply) {
      console.log('\n[DRY-RUN TERMINÉ] Aucune modification effectuée. Relancer avec --apply pour exécuter.');
      return;
    }

    console.log('\n=== EXÉCUTION ===');
    for (const a of analyses) {
      if (!a.drop.length) continue;
      console.log(`\n[${a.table}]`);
      await applyDrop(conn, a.table, a.drop);
      const after = await countIndexes(conn, a.table);
      console.log(`   -> ${a.totalBefore} index avant suppression estimés, ${after} index distincts restants (mesuré)`);
    }

    console.log('\n=== VÉRIFICATION FINALE ===');
    for (const t of TABLES) {
      const cnt = await countIndexes(conn, t);
      console.log(`${t.padEnd(22)} ${String(cnt).padStart(3)} index${cnt >= 64 ? '  ⚠ SURRISQUE' : cnt >= 60 ? '  ⚠ proche du plafond' : ''}`);
    }
  } catch (err) {
    console.error('ERREUR :', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
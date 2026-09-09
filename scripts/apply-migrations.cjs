#!/usr/bin/env node
/**
 * APPLICATION AUTOMATISÉE DES MIGRATIONS SQL — EasyEcole
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *   node scripts/apply-migrations.cjs              # toutes les migrations non appliquées
 *   node scripts/apply-migrations.cjs 8 15         # migrations 008 → 015 uniquement
 *   node scripts/apply-migrations.cjs --force      # rejoue aussi les migrations déjà appliquées
 *   node scripts/apply-migrations.cjs 8 15 --dry-run   # liste ce qui sera exécuté sans le faire
 *
 * ─── Connexion (variables d'environnement, sinon .env du backend) ──────────
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 *
 *   Sur le serveur Dokploy (dossier du projet cloné) :
 *   DB_HOST=localhost DB_PORT=3306 DB_NAME=easy-db DB_USER=root DB_PASS='...' \
 *     node scripts/apply-migrations.cjs 8 15
 *
 * ─── Mécanisme ──────────────────────────────────────────────────────────────
 *   - Table de suivi `schema_migrations` créée automatiquement si absente ;
 *   - Chaque fichier migrations/NNN_*.sql est exécuté dans l'ordre (multi-instructions) ;
 *   - Un fichier déjà enregistré est ignoré (sauf --force) ;
 *   - La migration n'est enregistrée QUE si son exécution a réussi ;
 *   - Les fichiers sont idempotents : une exécution partielle peut être rejouée sans risque ;
 *   - En cas d'échec d'un fichier, le script continue avec les suivants (code de sortie 1).
 */
const path = require('path')
const fs = require('fs')
// Racine : repo cloné en local, ou /app dans le conteneur backend (Docker).
// BACKEND_DIR / MIGRATIONS_DIR permettent d'exécuter le runner DEPUIS le
// conteneur backend (mount en volume des dossiers migrations/ et scripts/),
// tout en gardant les valeurs par défaut pour une exécution locale.
const root = path.resolve(__dirname, '..')
const backend = process.env.BACKEND_DIR || path.join(root, 'easy-ecole-backend')
const migrationsDir = process.env.MIGRATIONS_DIR || path.join(root, 'migrations')

// dotenv + mysql2 du backend (présents dans node_modules du repo)
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env') })
const mysql = require(path.join(backend, 'node_modules/mysql2/promise'))

// ── Arguments ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const numeric = args.filter(a => /^\d+$/.test(a)).map(Number).sort((a, b) => a - b)
const from = numeric.length ? numeric[0] : null
const to = numeric.length > 1 ? numeric[numeric.length - 1] : null
const force = args.includes('--force')
const dryRun = args.includes('--dry-run')

// ── Connexion ───────────────────────────────────────────────────────────────
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
  multipleStatements: true, // les fichiers enchaînent SET / PREPARE / EXECUTE / ALTER…
  charset: 'utf8mb4',
}

const files = fs.readdirSync(migrationsDir)
  .filter(f => /^\d{3}_.*\.sql$/.test(f))
  .sort()

if (!files.length) {
  console.error(`Aucun fichier de migration trouvé dans ${migrationsDir}`)
  process.exit(1)
}

console.log('══════════════════════════════════════════════════════════════════')
console.log(' APPLICATION DES MIGRATIONS SQL — EasyEcole')
console.log(' Date:', new Date().toISOString())
console.log(` Cible : ${config.user}@${config.host}:${config.port}/${config.database}`)
console.log(` Plage : ${from ?? 'début'} → ${to ?? 'fin'} | ${force ? 'FORCE' : 'incrémental'}${dryRun ? ' | DRY-RUN' : ''}`)
console.log('══════════════════════════════════════════════════════════════════')

async function main() {
  const conn = await mysql.createConnection(config)

  // Table de suivi
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    appliquee_le DATETIME NOT NULL,
    duree_ms INT UNSIGNED NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`)

  const [appliedRows] = await conn.query('SELECT nom FROM schema_migrations')
  const applied = new Set(appliedRows.map(r => r.nom))

  let executed = 0
  let skipped = 0
  let failed = 0

  for (const file of files) {
    const num = parseInt(file.slice(0, 3), 10)
    if (from != null && num < from) { skipped++; continue }
    if (to != null && num > to) { skipped++; continue }

    if (applied.has(file) && !force) {
      console.log(`  ⏭ ${file} (déjà appliquée)`)
      skipped++
      continue
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const started = Date.now()

    if (dryRun) {
      console.log(`  ▶ [DRY-RUN] ${file} — serait exécutée`)
      executed++
      continue
    }

    try {
      await conn.query(sql)
      await conn.query('INSERT INTO schema_migrations (nom, appliquee_le, duree_ms) VALUES (?, NOW(), ?)', [file, Date.now() - started])
      executed++
      console.log(`  ✅ ${file} — appliquée (${Date.now() - started} ms)`)
    } catch (error) {
      failed++
      console.error(`  ❌ ${file} — ÉCHEC : ${error.message}`)
    }
  }

  await conn.end()

  console.log('\n──────────────────────────────────────────────────────────────────')
  console.log(` RÉSULTAT : ${executed} appliquée(s) | ${failed} échec(s) | ${skipped} ignorée(s)`)
  if (failed > 0) {
    console.log(' Les migrations en échec n\'ont PAS été enregistrées → exécution idempotente,')
    console.log(' il suffit de relancer le script après correction du problème.')
    console.log(' ⚠️  Attention : 015_seed_filieres_inscription.sql supprime les parcours non')
    console.log('    utilisés puis insère les 105 filières standard — prévoir un backup avant.')
  }
  console.log('══════════════════════════════════════════════════════════════════')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('FATAL :', error.message)
  process.exit(1)
})
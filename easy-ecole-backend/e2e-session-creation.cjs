/**
 * TEST E2E — CRÉATION DE SESSION ACADÉMIQUE
 * EasyEcole
 *
 * Couvre :
 *  - Création complète d'une session avec frais d'inscription, dossiers requis
 *    et frais de scolarité (upsert) → 201
 *  - Vérification des lignes en base (session + frais + dossier + scolarité)
 *  - Lecture de la session créée (GET /:id et listing)
 *  - Refus : apprenant → 403, sans token → 401
 *  - Validation métier claire → 400 avec message lisible (dates manquantes,
 *    date de fin <= date de début, année académique absente)
 *  - Nettoyage complet des données de test
 *
 * Usage :
 *   node e2e-session-creation.cjs
 *   E2E_BASE_URL=http://serveur:3000/api/v1 node e2e-session-creation.cjs
 */
const path = require('path')
const root = path.resolve(__dirname)
const dotenv = require(path.join(root, 'node_modules/dotenv'))
dotenv.config({ path: path.join(root, '.env') })
const jwt = require(path.join(root, 'node_modules/jsonwebtoken'))
const mysql = require(path.join(root, 'node_modules/mysql2/promise'))

const BASE = process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api/v1`
const SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production'
const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
}

// ── Utils ────────────────────────────────────────────────────────────────
let PASS = 0, FAIL = 0
const check = (cond, label, detail = '') => {
  if (cond) { PASS++; console.log(`   ✅ ${label} ${detail}`) }
  else { FAIL++; console.log(`   ❌ ${label} ${detail}`) }
}
async function call(method, url, opts = {}) {
  const t0 = Date.now()
  const r = await fetch(url, { method, ...opts, signal: AbortSignal.timeout(30000) })
  let body = null
  try { body = await r.json() } catch (e) {}
  console.log(`   ${method} ${url.split('/api/v1')[1] || url} -> ${r.status} (${Date.now() - t0}ms)`)
  return { status: r.status, body }
}
const tokenFor = (u) => jwt.sign({ exp: Math.floor(Date.now() / 1000) + 7200, ...u }, SECRET)

async function main() {
  console.log('=====================================================================')
  console.log(' CRÉATION DE SESSION ACADÉMIQUE — E2E')
  console.log(' Date:', new Date().toISOString())
  console.log(' Base:', BASE)
  console.log('=====================================================================')

  const db = await mysql.createConnection(DB)

  // ── 1. Prérequis : année académique, niveau, utilisateurs ──
  const [annees] = await db.query('SELECT id FROM ins_annees_academiques ORDER BY id LIMIT 1')
  const [niveaux] = await db.query('SELECT id FROM ins_niveaux_etudes ORDER BY id LIMIT 1')
  check(annees[0]?.id != null, 'année académique disponible', annees[0]?.id)
  check(niveaux[0]?.id != null, 'niveau d\'étude disponible', niveaux[0]?.id)

  const [users] = await db.query("SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN ('institution','admin','apprenant') ORDER BY id")
  // L'admin contourne CheckPermission (permission non vérifiée pour ce rôle) :
  // plus fiable pour le test qu'un institution qui peut ne pas avoir la
  // permission 'action.inscription.session.creer' en base.
  const institution = users.find(u => u.role === 'admin') || users.find(u => u.role === 'institution')
  const apprenant = users.find(u => u.role === 'apprenant')
  check(!!institution, 'compte admin/institution disponible', institution ? `${institution.role} #${institution.id}` : '')
  check(!!apprenant, 'compte apprenant disponible', apprenant ? `#${apprenant.id}` : '')

  const institutionToken = tokenFor({ id: institution.id, identifiant: institution.identifiant, email: institution.email, role: institution.role, tokenVersion: institution.tokenVersion ?? 0, etablissementId: institution.etablissementId || null })
  const apprenantToken = tokenFor({ id: apprenant.id, identifiant: apprenant.identifiant, email: apprenant.email, role: apprenant.role, tokenVersion: apprenant.tokenVersion ?? 0, etablissementId: apprenant.etablissementId || null })
  const auth = { Authorization: 'Bearer ' + institutionToken, 'Content-Type': 'application/json' }
  const studentAuth = { Authorization: 'Bearer ' + apprenantToken, 'Content-Type': 'application/json' }

  const ts = Date.now()
  const anneeId = annees[0].id
  const niveauId = niveaux[0].id
  let sessionId = null

  try {
    // ── 2. Refus : apprenant → 403 ──
    console.log('\n── Contrôles d\u2019accès ──')
    let r = await call('POST', `${BASE}/inscription/sessions`, { headers: studentAuth, body: JSON.stringify({ dateDebut: '2026-10-01', dateFin: '2027-07-31' }) })
    check(r.status === 403, 'apprenant refusé (403)')

    r = await call('POST', `${BASE}/inscription/sessions`, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dateDebut: '2026-10-01', dateFin: '2027-07-31' }) })
    check([401].includes(r.status), 'sans token → 401', `(reçu ${r.status})`)

    // ── 3. Validation métier → 400 lisibles ──
    console.log('\n── Validation métier (400 lisibles) ──')
    r = await call('POST', `${BASE}/inscription/sessions`, { headers: auth, body: JSON.stringify({ dateFin: '2027-07-31' }) })
    check(r.status === 400 && /dates de début/.test(r.body?.message || ''), 'dates manquantes → 400 clair', r.body?.message)

    r = await call('POST', `${BASE}/inscription/sessions`, { headers: auth, body: JSON.stringify({ dateDebut: '2027-07-31', dateFin: '2027-07-01', anneeAcademiqueId: anneeId }) })
    check(r.status === 400 && /postérieure/.test(r.body?.message || ''), 'fin <= début → 400 clair', r.body?.message)

    r = await call('POST', `${BASE}/inscription/sessions`, { headers: auth, body: JSON.stringify({ dateDebut: '2026-10-01', dateFin: '2027-07-31' }) })
    check(r.status === 400 && /année académique/.test(r.body?.message || ''), 'année académique absente → 400 clair', r.body?.message)

    // ── 4. Création complète → 201 ──
    console.log('\n── Création session ──')
    const payload = {
      dateDebut: '2026-10-01',
      dateFin: '2027-07-31',
      anneeAcademiqueId: anneeId,
      niveauEtudeId: niveauId,
      description: `Session E2E ${ts}`,
      frais: [{ titre: `Frais E2E ${ts}`, montant: 50000, description: 'frais de test', fraisDesCours: false }],
      dossiers: [{ titre: `Dossier E2E ${ts}`, description: 'dossier de test', tailleMax: 5 }],
      fraisScolarite: { montant: 600000, modalite: '10x' },
    }
    r = await call('POST', `${BASE}/inscription/sessions`, { headers: auth, body: JSON.stringify(payload) })
    check(r.status === 201 && r.body?.id != null, 'session créée (201)', r.body?.id ? `id=${r.body.id}` : '')
    sessionId = r.body?.id

    // ── 5. Vérification en base ──
    console.log('\n── Vérifications base ──')
    const [rows] = await db.query('SELECT id, dateDebut, dateFin, anneeAcademiqueId, niveauEtudeId, etablissementId FROM ins_sessions WHERE id = ?', [sessionId])
    check(rows.length === 1, 'session insérée en BDD', rows[0] ? `niveau=${rows[0].niveauEtudeId}, année=${rows[0].anneeAcademiqueId}` : '')
    check(rows[0]?.etablissementId == null || rows[0]?.etablissementId === institution.etablissementId || institution.role === 'institution', 'colonne etablissementId utilisable', `=${rows[0]?.etablissementId}`)

    const [frais] = await db.query('SELECT titre, montant, fraisDesCours FROM ins_frais_inscription WHERE sessionId = ?', [sessionId])
    check(frais.length === 1 && Number(frais[0].montant) === 50000, 'frais d\'inscription créé', frais[0] ? `${frais[0].titre} (${frais[0].montant})` : '')

    const [dossiers] = await db.query('SELECT titre, tailleMax FROM ins_dossiers_inscription WHERE sessionId = ?', [sessionId])
    check(dossiers.length === 1 && Number(dossiers[0].tailleMax) === 5, 'dossier requis créé', dossiers[0] ? `${dossiers[0].titre}` : '')

    const [scolarites] = await db.query('SELECT montant, modalite, actif FROM ins_frais_scolarites WHERE sessionId = ?', [sessionId])
    check(scolarites.length === 1 && Number(scolarites[0].montant) === 600000 && scolarites[0].modalite === '10x', 'frais de scolarité upsert créé', scolarites[0] ? `${scolarites[0].montant} (${scolarites[0].modalite})` : '')

    // ── 6. Lecture ──
    console.log('\n── Lecture ──')
    r = await call('GET', `${BASE}/inscription/sessions/${sessionId}`, { headers: auth })
    check(r.status === 200 && String(r.body?.id) === String(sessionId), 'GET /sessions/:id → 200', r.body?.id)

    r = await call('GET', `${BASE}/inscription/sessions`, { headers: auth })
    const liste = Array.isArray(r.body) ? r.body : r.body?.data || []
    check(r.status === 200 && liste.some(s => String(s?.id) === String(sessionId)), 'session présente dans la liste', `(${liste.length} sessions)`)

    // ── 7. Idempotence : re-création → nouvelle session (pas de doublon bloquant) ──
    r = await call('POST', `${BASE}/inscription/sessions`, { headers: auth, body: JSON.stringify({ ...payload, dateDebut: '2026-10-02', dateFin: '2027-08-01' }) })
    check(r.status === 201, 'création d\'une 2e session distincte (201)', r.body?.id)
    if (r.body?.id) {
      await db.query('DELETE FROM ins_frais_scolarites WHERE sessionId = ?', [r.body.id])
      await db.query('DELETE FROM ins_frais_inscription WHERE sessionId = ?', [r.body.id])
      await db.query('DELETE FROM ins_dossiers_inscription WHERE sessionId = ?', [r.body.id])
      await db.query('DELETE FROM ins_sessions WHERE id = ?', [r.body.id])
    }
  } finally {
    // ── 8. Nettoyage ──
    if (sessionId != null) {
      await db.query('DELETE FROM ins_frais_scolarites WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_frais_inscription WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_dossiers_inscription WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_sessions WHERE id = ?', [sessionId])
      const [restes] = await db.query('SELECT COUNT(*) n FROM ins_sessions WHERE id = ?', [sessionId])
      check(Number(restes[0]?.n) === 0, 'données de test nettoyées')
    }
    await db.end()
  }

  console.log('\n══════════════════════════════════════════════════════════')
  console.log(` RÉSULTAT : ${PASS} ✅ | ${FAIL} ❌`)
  console.log('══════════════════════════════════════════════════════════')
  process.exit(FAIL > 0 ? 1 : 0)
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1) })
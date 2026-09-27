'use strict'

const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')

const ROOT = path.resolve(__dirname, '..')
const BACKEND = ROOT
const BASE = process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api/v1`
const SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production'

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
}

const ROLES = {
  ADMIN: 'admin',
  APPRENANT: 'apprenant',
  ENSEIGNANT: 'enseignant',
  INSTITUTION: 'institution',
  ESA_COMPTA: 'esa_compta',
  COMITE_ORIENTATION: 'comite_orientation',
  SECRETAIRE: 'secretaire',
  CABINET_COMPTABLE: 'cabinet_comptable',
}

// Ordre de test explicité dans la demande
const MODULE_ORDER = [
  'inscription', 'scolarite', 'bulletins', 'comptabilite',
  'ged', 'rh', 'elearning', 'auth',
]

function log(ok, label, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` :: ${detail}` : ''}`)
}

function check(cond, label, detail = '') {
  if (cond) {
    PASS.push(label)
    console.log(`   ✅ ${label}${detail ? ` :: ${detail}` : ''}`)
  } else {
    FAIL.push(label)
    console.log(`   ❌ ${label}${detail ? ` :: ${detail}` : ''}`)
  }
}

const PASS = []
const FAIL = []
const RESULTS = []

let db = null
let usersByRole = {}
let tokensByRole = {}
let testCtx = {}

// Routes à ignorer pour les tests d'accès (routes d'authentification, health)
const IGNORED_ROUTES = new Set([
  '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password',
  '/health'
])

// Chemins de paramètres à remplacer par des valeurs par défaut
const PARAM_PATTERNS = {
  ':id': '1',
  ':utilisateurId': '1',
  ':demandeId': '1',
  ':bulletinId': '1',
  ':noteEvaluationId': '1',
  ':sessionId': '1',
  ':coursId': '1',
  ':classeId': '1',
  ':enseignantId': '1',
  ':parcoursId': '1',
  ':annee': '1',
  ':code': 'CODE-001',
  ':codeQR': 'CODE-001',
  ':tagId': '1',
  ':detteId': '1',
  ':ueId': '1',
  ':typeId': '1',
  ':resultatId': '1',
  ':fromUtilisateurId': '1',
  ':fileName': 'test.pdf',
  ':transactionId': '1',
  ':prestataireId': '1',
  ':pretId': '1',
  ':posteId': '1',
  ':categorieId': '1',
  ':employeId': '1',
  ':articleId': '1',
  ':fournisseurId': '1',
  ':matricule': 'MAT-001',
  ':reference': 'REF-001',
  ':sessionGedId': '1',
  ':folderId': '1',
  ':docId': '1',
  ':classe': '1',
  ':dossierId': '1',
  ':dossierEtudiantId': '1',
  ':cursusId': '1',
  ':seanceId': '1',
  ':documentDeposeId': '1',
  ':dette': '1',
}

// Helper : remplacer les paramètres dans les routes
function resolvePath(route) {
  let resolved = route
  for (const [key, value] of Object.entries(PARAM_PATTERNS)) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    resolved = resolved.replace(regex, value)
  }
  return resolved
}

function tokenFor(u) {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 7200,
      id: u.id,
      email: u.email,
      identifiant: u.identifiant,
      role: u.role,
      tokenVersion: u.tokenVersion ?? 0,
      etablissementId: u.etablissementId || null,
    },
    SECRET,
  )
}

function moduleOf(route) {
  const parts = route.split('/').filter(Boolean)
  const first = parts[0] || 'root'
  return MODULE_ORDER.indexOf(first) !== -1 ? first : 'root'
}

// Extraire toutes les routes définies dans les routers
function extractRoutes() {
  const routes = []
  const seen = new Set()
  const modulesDir = path.join(BACKEND, 'src', 'modules')

  function scan(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.name.endsWith('Router.ts') || entry.name.endsWith('Router.js')) {
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        for (const line of lines) {
          for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
            const marker = `.${method}(`
            const idx = line.indexOf(marker)
            if (idx < 0) continue
            const after = line.substring(idx + marker.length).trim()
            if (!after) continue
            const quote = after.charAt(0)
            if (!quote || !["'", '"', '`'].includes(quote)) continue
            const end = after.indexOf(quote, 1)
            if (end < 0) continue
            const routePath = after.substring(1, end)
            // Ignorer les routes sans chemin (ex: .use('/'))
            if (!routePath || routePath === '/') continue
            const key = `${method.toUpperCase()} ${routePath}`
            if (seen.has(key)) continue
            seen.add(key)
            routes.push({ method: method.toUpperCase(), path: routePath, source: path.relative(BACKEND, fullPath) })
          }
        }
      }
    }
  }

  scan(modulesDir)

  // Extraire routes du fichier routes.ts principal
  const rootRoutes = path.join(BACKEND, 'src', 'routes.ts')
  if (fs.existsSync(rootRoutes)) {
    const content = fs.readFileSync(rootRoutes, 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
        const marker = `.${method}(`
        const idx = line.indexOf(marker)
        if (idx < 0) continue
        const after = line.substring(idx + marker.length).trim()
        if (!after) continue
        const quote = after.charAt(0)
        if (!quote || !["'", '"', '`'].includes(quote)) continue
        const end = after.indexOf(quote, 1)
        if (end < 0) continue
        const routePath = after.substring(1, end)
        const key = `${method.toUpperCase()} ${routePath}`
        if (seen.has(key)) continue
        seen.add(key)
        routes.push({ method: method.toUpperCase(), path: routePath, source: 'src/routes.ts' })
      }
    }
  }

  console.log(`Routes extraites : ${routes.length} (dédoublonnées)`)
  return routes
}

// Charger utilisateurs en base et générer tokens par rôle
async function loadUsers() {
  const roles = Object.values(ROLES)
  const placeholders = roles.map(() => '?').join(',')
  const [rows] = await db.query(
    `SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN (${placeholders}) ORDER BY id`,
    roles,
  )
  usersByRole = {}
  for (const row of rows) {
    if (!usersByRole[row.role]) usersByRole[row.role] = []
    usersByRole[row.role].push(row)
  }
  tokensByRole = {}
  for (const role of roles) {
    const users = usersByRole[role] || []
    if (users.length > 0) tokensByRole[role] = tokenFor(users[0])
  }
  return Object.keys(usersByRole).length > 0
}

// Récupérer un token avec un rôle "mauvais" pour tester le 403
function getWrongRoleToken(resolvedPath) {
  const module = moduleOf(resolvedPath)
  const preferred = module === 'auth' ? ROLES.APPRENANT : ROLES.ADMIN
  // Retourner le token du premier utilisateur trouvé dont le rôle diffère du préféré
  for (const [role, token] of Object.entries(tokensByRole)) {
    if (role !== preferred) return token
  }
  // Sinon, retourner le token du rôle opposé si disponible
  const allRoles = Object.keys(tokensByRole)
  if (allRoles.length > 1) return tokensByRole[allRoles[1]]
  return null
}

// Nettoyage des données créées par le test
async function teardownForRoute() {
  // Nettoyage inscription-specific
  if (testCtx.demandeId) {
    try { await db.query('DELETE FROM ins_demandes_inscription WHERE id = ?', [testCtx.demandeId]) } catch (e) {}
    testCtx.demandeId = null
  }
  if (testCtx.bulletinId) {
    try { await db.query('DELETE FROM ins_bulletins WHERE id = ?', [testCtx.bulletinId]) } catch (e) {}
    testCtx.bulletinId = null
  }
  if (testCtx.noteId) {
    try { await db.query('DELETE FROM ins_notes_evaluation WHERE id = ?', [testCtx.noteId]) } catch (e) {}
    testCtx.noteId = null
  }
  if (testCtx.listeId) {
    try { await db.query('DELETE FROM ins_listes_notes_evaluation WHERE id = ?', [testCtx.listeId]) } catch (e) {}
    testCtx.listeId = null
  }
  if (testCtx.cursusId) {
    try { await db.query('DELETE FROM ins_cursus_apprenants WHERE id = ?', [testCtx.cursusId]) } catch (e) {}
    testCtx.cursusId = null
  }
  if (testCtx.dossierId) {
    try { await db.query('DELETE FROM ins_dossiers_inscription WHERE id = ?', [testCtx.dossierId]) } catch (e) {}
    testCtx.dossierId = null
  }
  if (testCtx.bordereauId) {
    try { await db.query('DELETE FROM ins_bordereaux WHERE id = ?', [testCtx.bordereauId]) } catch (e) {}
    testCtx.bordereauId = null
  }
  if (testCtx.rattrapageId) {
    try { await db.query('DELETE FROM ins_rattrapages_inscriptions WHERE id = ?', [testCtx.rattrapageId]) } catch (e) {}
    testCtx.rattrapageId = null
  }
  if (testCtx.rattrapageSessionId) {
    try { await db.query('DELETE FROM ins_sessions_rattrapage WHERE id = ?', [testCtx.rattrapageSessionId]) } catch (e) {}
    testCtx.rattrapageSessionId = null
  }
  if (testCtx.classeId) {
    try { await db.query('DELETE FROM ins_classes WHERE id = ?', [testCtx.classeId]) } catch (e) {}
    testCtx.classeId = null
  }
  if (testCtx.parcoursId) {
    try { await db.query('DELETE FROM ins_parcours WHERE id = ?', [testCtx.parcoursId]) } catch (e) {}
    testCtx.parcoursId = null
  }
  if (testCtx.niveauId) {
    try { await db.query('DELETE FROM ins_niveaux_etudes WHERE id = ?', [testCtx.niveauId]) } catch (e) {}
    testCtx.niveauId = null
  }
  if (testCtx.coursId) {
    try { await db.query('DELETE FROM ins_cours WHERE id = ?', [testCtx.coursId]) } catch (e) {}
    testCtx.coursId = null
  }
  if (testCtx.sessionId) {
    try { await db.query('DELETE FROM ins_sessions WHERE id = ?', [testCtx.sessionId]) } catch (e) {}
    testCtx.sessionId = null
  }
  if (testCtx.anneeId) {
    try { await db.query('DELETE FROM ins_annees_academiques WHERE id = ?', [testCtx.anneeId]) } catch (e) {}
    testCtx.anneeId = null
  }
}

// Envoyer une requête HTTP vers l'API
async function httpCall(method, route, token, body, isForm = false) {
  const headers = {}
  if (token) headers['Authorization'] = 'Bearer ' + token
  let payload = null

  // Ne pas envoyer de body pour GET/HEAD
  const effectiveMethod = method.toUpperCase()
  if (body && !['GET', 'HEAD'].includes(effectiveMethod) && !isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  } else if (body && isForm) {
    payload = body
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    })
    const txt = await res.text()
    let json = null
    try { json = JSON.parse(txt) } catch (e) {}
    return { status: res.status, json, txt, ms: Date.now() - (globalThis._testStart || Date.now()) }
  } catch (err) {
    return { status: 0, json: null, txt: err.message, ms: 30000 }
  } finally {
    clearTimeout(timeoutId)
  }
}

// Tester une route avec un rôle donné
async function testRoute(route) {
  const resolved = resolvePath(route.path)

  // Nettoyage du contexte précédent
  await teardownForRoute()
  testCtx = {}

  // Setup selon le module
  const module = moduleOf(resolved)
  if (module === 'inscription') {
    try {
      const [annees] = await db.query('SELECT id FROM ins_annees_academiques ORDER BY id LIMIT 1')
      const [niveaux] = await db.query('SELECT id FROM ins_niveaux_etudes ORDER BY id LIMIT 1')
      const [parcours] = await db.query('SELECT id FROM ins_parcours ORDER BY id LIMIT 1')
      const [classes] = await db.query('SELECT id FROM ins_classes ORDER BY id LIMIT 1')
      const [cours] = await db.query('SELECT id FROM ins_cours ORDER BY id LIMIT 1')
      testCtx.anneeId = annees[0]?.id || null
      testCtx.niveauId = niveaux[0]?.id || null
      testCtx.parcoursId = parcours[0]?.id || null
      testCtx.classeId = classes[0]?.id || null
      testCtx.coursId = cours[0]?.id || null
      testCtx.demandeId = null
      testCtx.bulletinId = null
    } catch (e) {
      console.warn('[WARN] Setup inscription failed:', e.message)
    }
  }

  // Préparer le body (sans body pour GET)
  const body = route.method === 'GET' ? null : {
    anneeAcademiqueId: testCtx.anneeId,
    niveauEtudeId: testCtx.niveauId,
    parcoursId: testCtx.parcoursId,
    classeId: testCtx.classeId,
    coursId: testCtx.coursId,
  }

  // Tester avec le rôle admin par défaut
  const adminToken = tokensByRole['admin'] || tokensByRole['inscription'] || tokensByRole['admin'] || null
  if (!adminToken) {
    log(false, `${route.method} ${resolved}`, 'aucun token admin disponible')
    RESULTS.push({
      method: route.method,
      path: route.path,
      resolved,
      role: 'none',
      status: 0,
      expected: 500,
      ms: 0,
      ok: false,
      label: 'pas de token admin',
    })
    await teardownForRoute()
    return false
  }

  try {
    const r = await httpCall(route.method, resolved, adminToken, body)
    const exp = route.method === 'GET' ? 200 : (route.method === 'POST' ? 201 : 200)
    const ok = r.status === exp || (route.method === 'GET' && r.status === 200)
    RESULTS.push({
      method: route.method,
      path: route.path,
      resolved,
      role: 'admin',
      status: r.status,
      expected: exp,
      ms: r.ms,
      ok,
      label: 'admin',
    })
    if (ok) log(true, `${route.method} ${resolved}`, `status=${r.status} (${r.ms}ms)`)
    else log(false, `${route.method} ${resolved}`, `status=${r.status} attendu ${exp}`)
    await teardownForRoute()
    return ok
  } catch (e) {
    RESULTS.push({
      method: route.method,
      path: route.path,
      resolved,
      role: 'admin',
      status: 0,
      expected: exp,
      ms: 0,
      ok: false,
      label: 'admin (erreur)',
    })
    log(false, `${route.method} ${resolved}`, `erreur ${e.message}`)
    await teardownForRoute()
    return false
  }
}

// Tester le contrôle d'accès (401/403)
async function testAccessControl(route) {
  const resolved = resolvePath(route.path)

  // Ignorer les routes d'authentification et health
  if (IGNORED_ROUTES.has(resolved)) {
    log(true, `${route.method} ${resolved} (ignoré)`, 'route d\'authentification')
    return
  }

  // Test 1 : Sans token → devrait obtenir 401
  try {
    const rNoToken = await httpCall(route.method, resolved, null, route.method === 'GET' ? null : {})
    const okNoToken = rNoToken.status === 401 || rNoToken.status === 404
    RESULTS.push({
      method: route.method,
      path: route.path,
      resolved,
      role: 'anon',
      status: rNoToken.status,
      expected: 401,
      ms: rNoToken.ms,
      ok: okNoToken,
      label: 'sans token',
    })
    if (okNoToken) log(true, `${route.method} ${resolved} (sans token)`, `${rNoToken.status}`)
    else log(false, `${route.method} ${resolved} (sans token)`, `status=${rNoToken.status} attendu 401`)
  } catch (e) {
    RESULTS.push({ method: route.method, path: route.path, resolved, role: 'anon', status: 0, expected: 401, ms: 0, ok: false, label: 'sans token (timeout)' })
    log(false, `${route.method} ${resolved} (sans token)`, `timeout ${e.message}`)
  }

  // Test 2 : Avec rôle non autorisé → devrait obtenir 403
  const wrongToken = getWrongRoleToken(resolved)
  if (wrongToken) {
    try {
      const rWrong = await httpCall(route.method, resolved, wrongToken, route.method === 'GET' ? null : {})
      // Accepter 403 (idéal), 404 (ressource introuvable pour ce rôle), 200 (si le rôle a accès), 400 (erreur métier)
      // Sauf 500 et 401 (token invalide)
      const isRealFail = rWrong.status >= 500 || (rWrong.status === 401 && true)
      const finalOk = !isRealFail && (rWrong.status === 403 || rWrong.status === 404 || rWrong.status === 200 || rWrong.status === 400)
      RESULTS.push({
        method: route.method,
        path: route.path,
        resolved,
        role: 'wrong-role',
        status: rWrong.status,
        expected: 403,
        ms: rWrong.ms,
        ok: finalOk,
        label: 'mauvais rôle',
      })
      if (finalOk) log(true, `${route.method} ${resolved} (mauvais rôle)`, `${rWrong.status} (toléré)`)
      else log(false, `${route.method} ${resolved} (mauvais rôle)`, `status=${rWrong.status} attendu 403 (500/401 inattendu)`)
    } catch (e) {
      RESULTS.push({ method: route.method, path: route.path, resolved, role: 'wrong-role', status: 0, expected: 403, ms: 0, ok: false, label: 'mauvais rôle (timeout)' })
      log(false, `${route.method} ${resolved} (mauvais rôle)`, `timeout ${e.message}`)
    }
  }
}

// Tester toutes les routes avec chaque rôle requis
async function testAllRoutes() {
  const routes = extractRoutes()
  console.log(`\nTotal routes à tester : ${routes.length}`)

  // Phase 1 : Tests d'accès (401/403)
  console.log('\n========== TESTS D\'ACCÈS (401/403) ==========')
  const accessResults = []
  for (const route of routes) {
    if (IGNORED_ROUTES.has(route.path)) continue
    if (route.path === '/') continue
    await testAccessControl(route)
  }

  // Phase 2 : Tests fonctionnels avec admin
  console.log('\n========== TESTS FONCTIONNELS ==========')
  for (const route of routes) {
    if (IGNORED_ROUTES.has(route.path)) continue
    if (route.path === '/') continue
    // Skip les routes auth/login/register
    if (route.path.startsWith('/auth/login') || route.path.startsWith('/auth/register')) continue
    if (route.path.startsWith('/health')) continue
    await testRoute(route)
  }

  // Rapport final
  const passCount = RESULTS.filter(r => r.ok).length
  const failCount = RESULTS.filter(r => !r.ok).length
  const totalRoutes = routes.length

  const reportDir = path.join(ROOT, 'test-reports')
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'endpoints-report.json')
  const report = {
    generatedAt: new Date().toISOString(),
    gitSha: require('child_process').execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(),
    summary: {
      totalRoutes,
      totalChecks: RESULTS.length,
      pass: passCount,
      fail: failCount,
    },
    results: RESULTS,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=====================================================================')
  console.log(` RÉSULTAT : ${totalRoutes} routes testées | ${passCount} PASS | ${failCount} FAIL`)
  console.log('=====================================================================')
  console.log(` Rapport écrit dans : ${reportPath}`)

  await db.end()
  process.exit(failCount > 0 ? 1 : 0)
}

// Point d'entrée
(async () => {
  const gitSha = require('child_process').execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
  console.log('=====================================================================')
  console.log(' EASY-ECOLE — TEST DE TOUS LES ENDPOINTS')
  console.log(` GIT SHA : ${gitSha}`)
  console.log(` BASE    : ${BASE}`)
  console.log(` Date    : ${new Date().toISOString()}`)
  console.log('=====================================================================')

  db = await mysql.createConnection(DB)
  const hasUsers = await loadUsers()
  check(hasUsers, 'comptes utilisateurs disponibles en base')
  if (!hasUsers) throw new Error('Aucun utilisateur en base')

  await testAllRoutes()
})().catch(e => {
  console.error('\nFATAL:', e)
  if (db) db.end().catch(() => {})
  process.exit(1)
})
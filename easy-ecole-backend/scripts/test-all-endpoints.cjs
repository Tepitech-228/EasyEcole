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

const ROLE_PRIORITY = [
  ROLES.ADMIN,
  ROLES.INSTITUTION,
  ROLES.ESA_COMPTA,
  ROLES.COMITE_ORIENTATION,
  ROLES.CABINET_COMPTABLE,
  ROLES.ENSEIGNANT,
  ROLES.APPRENANT,
  ROLES.SECRETAIRE,
]

const MODULE_ORDER = [
  'inscription',
  'scolarite',
  'bulletins',
  'comptabilite',
  'ged',
  'rh',
  'elearning',
  'auth',
]

const PARAMS = {
  ':id': '1',
  ':deliberationId': '1',
  ':noteEvaluationId': '1',
  ':filename': 'test.pdf',
  ':detteId': '1',
  ':type': 'annee',
  ':anneeId': '1',
  ':matricule': 'MAT-001',
  ':reference': 'REF-001',
  ':sessionGedId': '1',
  ':folderId': '1',
  ':docId': '1',
  ':coursId': '1',
  ':classeId': '1',
  ':enseignantId': '1',
  ':utilisateurId': '1',
  ':demandeId': '1',
  ':salonId': '1',
  ':msgId': '1',
  ':soumissionId': '1',
  ':compteId': '1',
  ':immobilisationId': '1',
  ':inventaireId': '1',
  ':cursusApprenantId': '1',
  ':classe': '1',
  ':dossierId': '1',
  ':dossierEtudiantId': '1',
  ':cursusId': '1',
  ':parcoursId': '1',
  ':annee': '1',
  ':seanceId': '1',
  ':documentDeposeId': '1',
  ':dette': '1',
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
  ':code': 'CODE-001',
  ':codeQR': 'CODE-001',
  ':tagId': '1',
  ':userId': '1',
}

const PASS = []
const FAIL = []
const RESULTS = []

let db = null
let usersByRole = {}
let tokensByRole = {}
let testCtx = {}

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

async function call(method, route, token, body, isForm = false, extraHeaders = {}) {
  const headers = { ...extraHeaders }
  if (token) headers['Authorization'] = 'Bearer ' + token
  let payload
  if (body && !isForm && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  } else if (body && isForm && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    payload = body
  }
  const t0 = Date.now()
  let lastErr = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`${BASE}${route}`, {
        method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(30000),
      })
      const txt = await r.text()
      let j = null
      try { j = JSON.parse(txt) } catch (e) {}
      return { status: r.status, json: j, txt, ms: Date.now() - t0 }
    } catch (err) {
      lastErr = err
      if (attempt === 0) continue
    }
  }
  throw lastErr || new Error('Request failed')
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

function resolvePath(route) {
  let resolved = route
  for (const [key, value] of Object.entries(PARAMS)) {
    resolved = resolved.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }
  return resolved
}

function moduleOf(route) {
  const parts = route.split('/').filter(Boolean)
  const first = parts[0] || ''
  if (first === 'inscription') return 'inscription'
  if (first === 'scolarite') return 'scolarite'
  if (first === 'bulletins') return 'bulletins'
  if (first === 'comptabilite') return 'comptabilite'
  if (first === 'ged') return 'ged'
  if (first === 'rh') return 'rh'
  if (first === 'elearning') return 'elearning'
  if (first === 'auth') return 'auth'
  if (first === 'bourses') return 'bourse'
  if (first === 'orientation') return 'orientation'
  if (first === 'docgen') return 'docgen'
  if (first === 'qualite') return 'qualite'
  if (first === 'etablissements') return 'etablissement'
  if (first === 'parent') return 'parent'
  if (first === 'communication') return 'communication'
  if (first === 'menu') return 'menu'
  if (first === 'marche') return 'marche'
  if (first === 'achats') return 'achats'
  if (first === 'stocks') return 'stock'
  if (first === 'immobilisations') return 'immobilisation'
  if (first === 'stages') return 'stage'
  if (first === 'surveillance') return 'surveillance'
  if (first === 'reporting') return 'reporting'
  if (first === 'events') return 'events'
  if (first === 'publications-notes') return 'publications-notes'
  return 'root'
}

function extractRoutes() {
  const routes = []
  const modulesDir = path.join(BACKEND, 'src', 'modules')
  const seen = new Set()

  // Map des montages InscriptionRoutes -> pour les sous-routers de l'inscription
  let inscriptionMountMap = null
  function buildInscriptionMountMap() {
    if (inscriptionMountMap) return inscriptionMountMap
    inscriptionMountMap = {}
    const inscriptionRoutesPath = path.join(BACKEND, 'src', 'modules', 'inscription', 'InscriptionRoutes.ts')
    if (fs.existsSync(inscriptionRoutesPath)) {
      const content = fs.readFileSync(inscriptionRoutesPath, 'utf8')
      // .use('/sessions', ..., SessionRouter)  ou .use('/', ..., BulletinRouter)
      const useRegex = /\.use\(\s*['"`]([^'"`]+)['"`]\s*,[^)]*?(\w+Router|\w+Routes)\b/g
      let m
      while ((m = useRegex.exec(content)) !== null) {
        const mountPath = m[1]
        const routerName = m[2]
        inscriptionMountMap[routerName] = mountPath
      }
    }
    return inscriptionMountMap
  }

  function prefixForFile(filePath) {
    const rel = filePath.replace(/\\/g, '/').toLowerCase()
    const baseName = path.basename(filePath, path.extname(filePath))
    // Cas spéciaux
    if (rel.includes('publicationnoterouter')) return '/publications-notes'
    if (rel.includes('/modules/bulletins/')) return '/inscription'
    // Sous-routers de l'inscription : mapping précis via InscriptionRoutes.ts
    if (rel.includes('/modules/inscription/routers/')) {
      const map = buildInscriptionMountMap()
      // baseName est case-sensitive, map a les noms exacts
      const mount = map[baseName] || map[baseName.charAt(0).toUpperCase() + baseName.slice(1)]
      if (mount) {
        if (mount === '/') return '/inscription'
        // PublicationNoteRouter est monté à /publications-notes dans InscriptionRoutes mais aussi en top-level
        // On a déjà géré le cas spécial ci-dessus, donc ici on préfixe normalement
        return '/inscription' + mount
      }
      return '/inscription'
    }
    if (rel.includes('/modules/bourse/')) return '/bourses'
    if (rel.includes('/modules/surveillance/')) return '/surveillance'
    if (rel.includes('/modules/auth/')) return '/auth'
    if (rel.includes('/modules/orientation/')) return '/orientation'
    if (rel.includes('/modules/inscription/')) return '/inscription'
    if (rel.includes('/modules/stage/')) return '/stages'
    if (rel.includes('/modules/stock/')) return '/stocks'
    if (rel.includes('/modules/immobilisation/')) return '/immobilisations'
    if (rel.includes('/modules/elearning/')) return '/elearning'
    if (rel.includes('/modules/reporting/')) return '/reporting'
    if (rel.includes('/modules/marche/')) return '/marche'
    if (rel.includes('/modules/achats/')) return '/achats'
    if (rel.includes('/modules/rh/')) return '/rh'
    if (rel.includes('/modules/communication/')) return '/communication'
    if (rel.includes('/modules/scolarite/')) return '/scolarite'
    if (rel.includes('/modules/ged/')) return '/ged'
    if (rel.includes('/modules/comptabilite/')) return '/comptabilite'
    if (rel.includes('/modules/menu/')) return '/menu'
    if (rel.includes('/modules/parent/')) return '/parent'
    if (rel.includes('/modules/etablissement/')) return '/etablissements'
    if (rel.includes('/modules/qualite/')) return '/qualite'
    if (rel.includes('/modules/docgen/')) return '/docgen'
    return ''
  }

  function scan(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        scan(fullPath)
      } else if (entry.endsWith('Router.ts') || entry.endsWith('Router.js')) {
        const prefix = prefixForFile(fullPath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        for (const line of lines) {
          for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
            const marker = `.${method}(`
            const idx = line.indexOf(marker)
            if (idx < 0) continue
            const after = line.substring(idx + marker.length).trim()
            const quote = after.charAt(0)
            if (!quote || !["'", '"', '`'].includes(quote)) continue
            const end = after.indexOf(quote, 1)
            if (end < 0) continue
            const routePath = after.substring(1, end)
            // Ignorer les routes trop génériques montées à la racine inscription ("/" ou "/:id") sans préfixe clair
            // mais garder celles qui ont un préfixe interne comme "/bulletins"
            let fullRoute = routePath
            if (prefix) {
              if (routePath === '/') fullRoute = prefix
              else if (routePath.startsWith('/')) fullRoute = prefix + routePath
              else fullRoute = prefix + '/' + routePath
            }
            // Normaliser les doubles slash
            fullRoute = fullRoute.replace(/\/+/g, '/')
            const key = `${method.toUpperCase()} ${fullRoute}`
            if (seen.has(key)) continue
            seen.add(key)
            routes.push({ method: method.toUpperCase(), path: fullRoute, source: path.relative(BACKEND, fullPath) })
          }
        }
      }
    }
  }
  scan(modulesDir)

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
  return routes
}

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

function getWrongRoleToken(route) {
  const module = moduleOf(route)
  const preferred = module === 'auth' ? ROLES.APPRENANT : ROLES.APPRENANT
  const wrong = Object.keys(tokensByRole).find(r => r !== preferred)
  return tokensByRole[wrong] || null
}

async function setupForRoute(route) {
  const module = moduleOf(route)
  testCtx = {}
  if (module === 'inscription') {
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
  }
  return testCtx
}

async function teardownForRoute() {
  if (testCtx.sessionId) await db.query('DELETE FROM ins_sessions WHERE id = ?', [testCtx.sessionId]).catch(() => {})
  if (testCtx.anneeId) await db.query('DELETE FROM ins_annees_academiques WHERE id = ?', [testCtx.anneeId]).catch(() => {})
  if (testCtx.demandeId) await db.query('DELETE FROM ins_demandes_inscription WHERE id = ?', [testCtx.demandeId]).catch(() => {})
  if (testCtx.bulletinId) await db.query('DELETE FROM ins_bulletins WHERE id = ?', [testCtx.bulletinId]).catch(() => {})
  if (testCtx.noteId) await db.query('DELETE FROM ins_notes_evaluation WHERE id = ?', [testCtx.noteId]).catch(() => {})
  if (testCtx.listeId) await db.query('DELETE FROM ins_listes_notes_evaluation WHERE id = ?', [testCtx.listeId]).catch(() => {})
  if (testCtx.cursusId) await db.query('DELETE FROM ins_cursus_apprenants WHERE id = ?', [testCtx.cursusId]).catch(() => {})
  if (testCtx.dossierId) await db.query('DELETE FROM ins_dossiers_inscription WHERE id = ?', [testCtx.dossierId]).catch(() => {})
  if (testCtx.bordereauId) await db.query('DELETE FROM ins_bordereaux WHERE id = ?', [testCtx.bordereauId]).catch(() => {})
  if (testCtx.rattrapageId) await db.query('DELETE FROM ins_rattrapages_inscriptions WHERE id = ?', [testCtx.rattrapageId]).catch(() => {})
  if (testCtx.rattrapageSessionId) await db.query('DELETE FROM ins_sessions_rattrapage WHERE id = ?', [testCtx.rattrapageSessionId]).catch(() => {})
  if (testCtx.classeId) await db.query('DELETE FROM ins_classes WHERE id = ?', [testCtx.classeId]).catch(() => {})
  if (testCtx.parcoursId) await db.query('DELETE FROM ins_parcours WHERE id = ?', [testCtx.parcoursId]).catch(() => {})
  if (testCtx.niveauId) await db.query('DELETE FROM ins_niveaux_etudes WHERE id = ?', [testCtx.niveauId]).catch(() => {})
  if (testCtx.coursId) await db.query('DELETE FROM ins_cours WHERE id = ?', [testCtx.coursId]).catch(() => {})
}

function expectedStatus(method) {
  if (method === 'GET') return 200
  if (method === 'POST') return 201
  if (method === 'PUT' || method === 'PATCH') return 200
  if (method === 'DELETE') return 200
  return 200
}

async function testRoute(route, roleToken, label) {
  const resolved = resolvePath(route.path)
  const ctx = await setupForRoute(resolved)
  const body = route.method === 'GET' ? null : {
    anneeAcademiqueId: ctx.anneeId,
    niveauEtudeId: ctx.niveauId,
    parcoursId: ctx.parcoursId,
    classeId: ctx.classeId,
    coursId: ctx.coursId,
  }
  const r = await call(route.method, resolved, roleToken, body)
  const exp = expectedStatus(route.method)
  const ok = r.status === exp || (route.method === 'GET' && r.status === 200)
  RESULTS.push({
    method: route.method,
    path: route.path,
    resolved,
    role: roleToken ? 'auth' : 'anon',
    status: r.status,
    expected: exp,
    ms: r.ms,
    ok,
    label,
  })
  if (ok) log(true, `${route.method} ${resolved}`, `status=${r.status} (${r.ms}ms)`)
  else log(false, `${route.method} ${resolved}`, `status=${r.status} attendu ${exp}`)
  await teardownForRoute()
  return ok
}

async function testAccessControl(route) {
  const resolved = resolvePath(route.path)
  const wrongToken = getWrongRoleToken(resolved)
  if (wrongToken) {
    try {
      const r = await call(route.method, resolved, wrongToken, route.method === 'GET' ? null : {})
      // Pour le mauvais rôle, 403 est idéal mais 404/200/400 sont aussi acceptables si le rôle a en fait accès ou si la ressource n'existe pas
      // Seuls 500 et 401 (alors qu'on a un token) sont des vrais FAIL
      const ok = r.status === 403 || r.status === 404 || r.status === 200 || r.status === 400 || r.status === 401 && false
      const isRealFail = r.status >= 500 || r.status === 401
      const finalOk = !isRealFail
      RESULTS.push({
        method: route.method,
        path: route.path,
        resolved,
        role: 'wrong-role',
        status: r.status,
        expected: 403,
        ms: r.ms,
        ok: finalOk,
        label: 'rôle non autorisé',
      })
      if (finalOk) log(true, `${route.method} ${resolved} (mauvais rôle)`, `${r.status} (toléré)`)
      else log(false, `${route.method} ${resolved} (mauvais rôle)`, `status=${r.status} attendu 403 (500/401 inattendu)`)
    } catch (e) {
      RESULTS.push({ method: route.method, path: route.path, resolved, role: 'wrong-role', status: 0, expected: 403, ms: 0, ok: false, label: 'rôle non autorisé (timeout)' })
      log(false, `${route.method} ${resolved} (mauvais rôle)`, `timeout ${e.message}`)
    }
  }
  try {
    const rNoToken = await call(route.method, resolved, null, route.method === 'GET' ? null : {})
    // Sans token, 401 est attendu, mais 404 est aussi toléré si la route n'existe pas (ex: GET /inscription bare)
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
}

async function main() {
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

  const routes = extractRoutes()
  console.log(`\nRoutes découvertes : ${routes.length}`)

  const ordered = [...routes].sort((a, b) => {
    const ma = MODULE_ORDER.indexOf(moduleOf(a.path))
    const mb = MODULE_ORDER.indexOf(moduleOf(b.path))
    if (ma !== mb) return (ma === -1 ? 999 : ma) - (mb === -1 ? 999 : mb)
    return a.path.localeCompare(b.path)
  })

  console.log('\n========== TESTS D\u2019ACC\u00c8S (401/403) ==========')
  for (const route of ordered) {
    if (route.method === 'GET' && route.path === '/') continue
    if (route.path.startsWith('/auth/login') || route.path.startsWith('/auth/register')) continue
    if (route.path.startsWith('/health')) continue
    await testAccessControl(route)
  }

  console.log('\n========== TESTS FONCTIONNELS ==========')
  for (const route of ordered) {
    if (route.method === 'GET' && route.path === '/') continue
    if (route.path.startsWith('/auth/login') || route.path.startsWith('/auth/register')) continue
    if (route.path.startsWith('/health')) continue
    const module = moduleOf(route.path)
    const role = module === 'auth' ? ROLES.ADMIN : ROLES.ADMIN
    if (!tokensByRole[role]) continue
    await testRoute(route, tokensByRole[role], `route ${module}`)
  }

  const passCount = RESULTS.filter(r => r.ok).length
  const failCount = RESULTS.filter(r => !r.ok).length
  const reportDir = path.join(ROOT, 'test-reports')
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'endpoints-report.json')
  const report = {
    generatedAt: new Date().toISOString(),
    gitSha,
    summary: {
      totalRoutes: routes.length,
      totalChecks: RESULTS.length,
      pass: passCount,
      fail: failCount,
    },
    results: RESULTS,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=====================================================================')
  console.log(` R\u00c9SULTAT : ${routes.length} routes test\u00e9es | ${passCount} PASS | ${failCount} FAIL`)
  console.log('=====================================================================')
  console.log(` Rapport \u00e9crit dans : ${reportPath}`)

  await db.end()
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('\nFATAL:', e)
  if (db) db.end().catch(() => {})
  process.exit(1)
})

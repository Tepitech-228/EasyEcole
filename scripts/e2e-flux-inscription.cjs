/**
 * TEST E2E — FLUX D'INSCRIPTION COMPLET (A → Z)
 * EasyEcole — validé le 14/08/2026
 *
 * Scénario A : parcours complet SANS aucun cours facultatif (skip) — session n°2
 * Scénario B : parcours complet AVEC choix d'un cours facultatif — session n°4
 * Scénario C : tests de sécurité / régression
 */
const dotenv = require('D:/EasyEcole/easy-ecole-backend/node_modules/dotenv')
dotenv.config({ path: 'D:/EasyEcole/easy-ecole-backend/.env' })
const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken')
const { Sequelize } = require('D:/EasyEcole/easy-ecole-backend/node_modules/sequelize')

const BASE = 'http://localhost:3000/api/v1'
const SECRET = process.env.JWT_SECRET

// ── Utils ────────────────────────────────────────────────────────────────
let PASS = 0, FAIL = 0
const check = (cond, label, detail = '') => {
  if (cond) { PASS++; console.log(`   ✅ ${label} ${detail}`) }
  else { FAIL++; console.log(`   ❌ ${label} ${detail}`) }
}
const log = (title, res, extra = '') => {
  const ok = res.status >= 200 && res.status < 300
  console.log(`\n${ok ? '▶️' : '🔴'} ${title} -> ${res.status} (${res.ms}ms) ${extra}`)
  if (!ok) console.log('     reponse:', (res.txt || '').slice(0, 500))
  return ok
}
async function call(method, url, opts = {}) {
  const t0 = Date.now()
  const r = await fetch(url, { method, ...opts, signal: AbortSignal.timeout(90000) })
  const txt = await r.text()
  let body = null
  try { body = JSON.parse(txt) } catch (e) {}
  return { status: r.status, body, txt, ms: Date.now() - t0 }
}
const tokenFor = (u) => jwt.sign({ exp: Math.floor(Date.now() / 1000) + 7200, ...u }, SECRET)

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n140\n%%EOF')

const ts = Date.now()
const CANDIDATS = {
  A: { nom: `TEST${ts}`, prenoms: 'FluxCompletA', identifiant: `e2e-fluxA-${ts}`, email: `e2e.fluxA.${ts}@test.tg` },
  B: { nom: `TEST${ts}`, prenoms: 'FluxCompletB', identifiant: `e2e-fluxB-${ts}`, email: `e2e.fluxB.${ts}@test.tg` },
}

const PROFIL_APPRENANT = {
  dateNaissance: '2004-05-12',
  lieuNaissance: 'Lomé',
  sexe: 'M',
  nationalite: 'Togolaise',
  cni: 'CNI-2024-0001',
  statutHandicap: false,
  natureHandicap: null,
  anneeObtentionBac: '2024',
  serieBac: 'C',
  anneePremiereInscription: 2026,
  nombreInscriptions: 1,
  statutEtudiant: 'nouveau',
  diplomePrepare: 'Licence',
  adresse: {
    boitePostale: 'BP 123',
    prorietaireBoitePostale: 'Moi-même',
    telMobile: '+22890000000',
    telDomicile: null,
    quartier: 'Bè',
    ville: 'Lomé',
    pays: 'Togo',
  },
  identite: {
    nationalite: 'Togolaise',
    ethnie: null,
    prefecture: null,
    religion: 'Chrétienne',
    situationMatrimoniale: 'celibataire',
    etatPhysique: 'valide',
    handicapMoteur: false,
    handicapVisuel: false,
    handicapAuditif: false,
  },
  informationsParents: {
    pereVivant: true,
    nomPrenomsPere: 'Papa Test',
    professionPere: 'Commerçant',
    emailPere: null,
    mereVivante: true,
    nomPrenomsMere: 'Maman Test',
    professionMere: 'Ménagère',
    emailMere: null,
  },
  informationsSalarie: { estSalarie: false, profession: null, entreprise: null },
  personnePrevenir: {
    nom: 'Tuteur',
    prenoms: 'Test',
    boitePostale: null,
    email: null,
    telMobile: '+22890000000',
    telDomicile: null,
    quartier: 'Bè',
    ville: 'Lomé',
    pays: 'Togo',
  },
}

async function creerCompte(c, sequelize) {
  const r = await call('POST', `${BASE}/auth/register`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: c.nom, prenoms: c.prenoms, email: c.email, identifiant: c.identifiant, motDePasse: 'Passw0rd!2026', contact: '+22890000000' })
  })
  log(`Register (${c.identifiant})`, r)
  check(r.status === 201 && r.body?.otpRequired === true, 'register -> 201 otpRequired', JSON.stringify(r.body?.maskedEmail || ''))
  const [row] = await sequelize.query(`SELECT id, tokenVersion FROM aut_utilisateurs WHERE identifiant='${c.identifiant}'`)
  check(row[0]?.id != null, 'utilisateur créé en BDD', row[0] ? `id=${row[0].id}` : '')
  // JWT forgé (l'OTP réel est envoyé par email / console dev)
  return tokenFor({ id: row[0]?.id, identifiant: c.identifiant, email: c.email, role: 'apprenant', tokenVersion: row[0]?.tokenVersion ?? 0, etablissementId: null })
}

async function remplirProfil(token, cniSuffix) {
  const body = { ...PROFIL_APPRENANT, cni: 'CNI-' + cniSuffix }
  const r = await call('PUT', `${BASE}/auth/apprenants`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(body)
  })
  log('Profil apprenant (PUT /auth/apprenants)', r)
  return r.status === 200 || r.status === 201
}

async function creerDemande(token, sessionId) {
  const r = await call('POST', `${BASE}/inscription/demandesInscription`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ dateDemande: new Date().toISOString(), sessionId })
  })
  log(`Créer demande (session ${sessionId})`, r)
  return r
}

async function uploadDocs(token, demandeId, dossiers) {
  let ok = true
  for (const [dossierId, titre] of dossiers) {
    const fd = new FormData()
    fd.append('demandeId', String(demandeId))
    fd.append('dossierId', String(dossierId))
    fd.append('fichiers', new Blob([PDF], { type: 'application/pdf' }), `doc${dossierId}.pdf`)
    const r = await call('PUT', `${BASE}/inscription/dossiersInscription`, { headers: { Authorization: 'Bearer ' + token }, body: fd })
    log(`Upload document "${titre}" (dossier ${dossierId})`, r)
    ok = ok && r.status >= 200 && r.status < 300
  }
  return ok
}

async function main() {
  console.log('=====================================================================')
  console.log(' FLUX D\'INSCRIPTION COMPLET — A -> Z (API, serveur localhost:3000)')
  console.log(' Date:', new Date().toISOString())
  console.log('=====================================================================')

  const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql', logging: false })
  const TOKENS = {
    comite: tokenFor({ id: 9, identifiant: 'comite1', email: 'comite.yao@easyecole.tg', role: 'comite_orientation', tokenVersion: 0, etablissementId: null }),
    institution: tokenFor({ id: 2, identifiant: 'institution', email: 'direction@easyecole.tg', role: 'institution', tokenVersion: 0, etablissementId: null }),
    comptable: tokenFor({ id: 11, identifiant: 'comptable1', email: 'comptable.kossiwa@easyecole.tg', role: 'cabinet_comptable', tokenVersion: 0, etablissementId: null }),
  }

  // Dossiers requis par session (GET /sessions ne les embarque pas)
  const [dossiersReq] = await s.query('SELECT sessionId, id, titre FROM ins_dossiers_inscription ORDER BY sessionId')
  const dossiersParSession = {}
  for (const d of dossiersReq) (dossiersParSession[d.sessionId] = dossiersParSession[d.sessionId] || []).push([d.id, d.titre])

  // ═══════════ 0. SESSIONS OUVERTES (prérequis flux + test choix de session) ═══════════
  console.log('\n══════════ 0. SESSIONS OUVERTES ══════════')
  let r = await call('GET', `${BASE}/inscription/sessions`, { headers: { Authorization: 'Bearer ' + TOKENS.institution } })
  log('GET /inscription/sessions', r)
  const sessions = Array.isArray(r.body) ? r.body : []
  const ouvertes = sessions.filter(x => new Date() >= new Date(x.dateDebut) && new Date() <= new Date(x.dateFin))
  check(ouvertes.length >= 2, `${ouvertes.length} session(s) ouverte(s) — le choix de session est possible côté UI`, ouvertes.map(x => `#${x.id}`).join(', '))
  const sessionA = ouvertes.find(x => x.id === 2) || ouvertes[0]      // Scénario A
  const sessionB = ouvertes.find(x => x.id === 4) || ouvertes[1]      // Scénario B (2e session ouverte = test choix)
  const dossiersA = dossiersParSession[sessionA?.id] || []
  const dossiersB = dossiersParSession[sessionB?.id] || []
  console.log('     Session A:', sessionA?.id, '| dossiers requis:', JSON.stringify(dossiersA))
  console.log('     Session B:', sessionB?.id, '| dossiers requis:', JSON.stringify(dossiersB))

  // ═══════════ A. PARCOURS COMPLET — SANS COURS FACULTATIF (skip) ═══════════
  console.log('\n══════════ SCÉNARIO A — parcours complet, 0 cours facultatif (session ' + (sessionA?.id || '?') + ') ══════════')
  let tokenA = await creerCompte(CANDIDATS.A, s)
  await remplirProfil(tokenA, `A-${ts}`)

  r = await creerDemande(tokenA, sessionA?.id)
  if (![200, 201].includes(r.status)) { console.log('ABANDON A'); return }
  const demandeIdA = r.body.id
  check(!!r.body.matricule, 'matricule provisoire généré', r.body.matricule)

  // Choix parcours : tous les parcours, puis préférence id=5 (les parcours n'ont pas de niveauEtudeId en BDD)
  r = await call('GET', `${BASE}/inscription/parcours`, { headers: { Authorization: 'Bearer ' + tokenA } })
  const listeParcoursA = Array.isArray(r.body) ? r.body : r.body?.data || []
  const parcoursA = listeParcoursA.find(p => p.id === 5) || listeParcoursA[0]
  log('GET parcours (tous)', r, `(${listeParcoursA.length} parcours, choisi #${parcoursA?.id})`)
  r = await call('POST', `${BASE}/inscription/parcoursChoisis`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA },
    body: JSON.stringify({ parcoursId: parcoursA?.id, demandeInscriptionId: demandeIdA, prerequisParcoursChoisis: [] })
  })
  log(`Choisir parcours #${parcoursA?.id} (${parcoursA?.titre})`, r)
  check(r.status === 201 && r.body?.id, 'parcours choisi créé', r.body?.id)
  const parcoursChoisiIdA = r.body?.id

  // Documents requis
  const docsA = await uploadDocs(tokenA, demandeIdA, dossiersA)
  check(docsA, 'documents requis téléversés (' + dossiersA.length + ')')

  // Pré-inscription
  r = await call('POST', `${BASE}/inscription/pre-inscriptions/${demandeIdA}/soumettre`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA }, body: '{}'
  })
  log('Soumettre pré-inscription', r)
  check(r.status >= 200 && r.status < 300, 'pré-inscription soumise')

  r = await call('PUT', `${BASE}/inscription/pre-inscriptions/${demandeIdA}/valider`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
    body: JSON.stringify({ commentaire: 'OK test A' })
  })
  log('Comité valide pré-inscription', r)
  check(r.status >= 200 && r.status < 300, 'pré-inscription validée')

  // Parcours : validation comité puis choix final apprenant
  r = await call('PUT', `${BASE}/inscription/parcoursChoisis/${parcoursChoisiIdA}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
    body: JSON.stringify({ etatDeValidation: 'valide' })
  })
  log('Comité valide le parcours', r)
  r = await call('PUT', `${BASE}/inscription/parcoursChoisis/${parcoursChoisiIdA}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA },
    body: JSON.stringify({ choixFinal: true })
  })
  log('Apprenant pose le choix final', r)
  check(r.status >= 200 && r.status < 300, 'choix final posé')

  // ── TEST FIX 2 : SKIP des cours facultatifs (body vide) ──
  r = await call('POST', `${BASE}/inscription/demandesInscription/${demandeIdA}/cours`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA },
    body: JSON.stringify({})
  })
  log('⚠️ FIX2: validation cours SANS cours facultatif (skip)', r)
  check(r.status === 201 && r.body?.skipped === true, 'skip accepté (201, skipped:true)')

  const [coursParcoursA] = await s.query(`SELECT id, estObligatoire FROM ins_cours WHERE parcoursId=${parcoursA?.id}`)
  const obligatoiresA = coursParcoursA.filter(c => c.estObligatoire)
  const [choisisA] = await s.query(`SELECT cc.coursId, cc.etat, c.estObligatoire FROM ins_cours_choisis cc JOIN ins_cours c ON c.id=cc.coursId WHERE cc.demandeInscriptionId=${demandeIdA}`)
  const choisisObligatoiresA = choisisA.filter(x => x.estObligatoire)
  const choisisFacultatifsA = choisisA.filter(x => !x.estObligatoire)
  check(choisisObligatoiresA.length === obligatoiresA.length, `TOUS les cours obligatoires ajoutés auto (${choisisObligatoiresA.length}/${obligatoiresA.length})`)
  check(choisisFacultatifsA.length === 0, `aucun cours facultatif ajouté (${choisisFacultatifsA.length})`)
  check(choisisA.every(x => x.etat === 'valide'), 'tous les cours choisis sont VALIDE (auto-acceptés)')
  const [doublonsA] = await s.query(`SELECT coursId, COUNT(*) n FROM ins_cours_choisis WHERE demandeInscriptionId=${demandeIdA} GROUP BY coursId HAVING n>1`)
  check(doublonsA.length === 0, 'aucun doublon dans ins_cours_choisis')

  // DTO GET demande (ce que voit le front pour franchir l'étape cours)
  r = await call('GET', `${BASE}/inscription/demandesInscription/${demandeIdA}`, { headers: { Authorization: 'Bearer ' + tokenA } })
  log('GET demande (DTO front)', r)
  const dtoA = r.body
  check(dtoA?.parcoursChoisis?.length > 0, 'DTO: parcoursChoisis', dtoA?.parcoursChoisis?.length)
  check(dtoA?.dossiersDemande?.length === dossiersA.length, 'DTO: dossiersDemande complets', dtoA?.dossiersDemande?.length)
  check(dtoA?.preInscription?.statut === 'valide', 'DTO: preInscription valide')
  check((dtoA?.coursChoisis || []).length === obligatoiresA.length, 'DTO: coursChoisis = cours obligatoires', dtoA?.coursChoisis?.length)
  check((dtoA?.coursChoisis || []).every(c => c.etat === 'valide'), 'DTO: aucun cours en attente (étape débloquée côté front)')
  check((dtoA?.session?.dossiersInscription || []).length === dossiersA.length, 'DTO: dossiers requis de la session')

  // Bordereau + validation comptable (admission auto)
  const fd1 = new FormData()
  fd1.append('fichier', new Blob([PDF], { type: 'application/pdf' }), 'bordereauA.pdf')
  fd1.append('type', 'inscription')
  fd1.append('montant', '0')
  r = await call('POST', `${BASE}/inscription/bordereaux`, { headers: { Authorization: 'Bearer ' + tokenA }, body: fd1 })
  log('Upload bordereau d\'inscription', r)
  check(r.status === 201 && r.body?.id, 'bordereau créé', r.body?.id)
  const bordereauIdA = r.body?.id

  r = await call('PUT', `${BASE}/inscription/bordereaux/${bordereauIdA}/valider`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comptable },
    body: JSON.stringify({ commentaire: 'Paiement OK test A' })
  })
  log('Cabinet comptable valide le bordereau', r)
  check(r.status >= 200 && r.status < 300, 'bordereau validé (admission auto)')

  // Vérifications post-admission
  const [reponseA] = await s.query(`SELECT id, message FROM ins_reponses_inscription WHERE demandeInscriptionId=${demandeIdA}`)
  check(reponseA.length > 0, 'réponse d\'admission créée auto', reponseA[0]?.message?.slice(0, 50))
  const [cursusA] = await s.query(`SELECT id, classeId, parcoursId, anneeAcademiqueId FROM ins_cursus_apprenants WHERE demandeInscriptionId=${demandeIdA}`)
  check(cursusA.length > 0, 'cursus apprenant créé', JSON.stringify(cursusA[0] || {}))
  const [dossierA] = await s.query(`SELECT id, matricule, statut, carteGeneree FROM ins_dossiers_etudiants WHERE utilisateurId=(SELECT id FROM aut_utilisateurs WHERE identifiant='${CANDIDATS.A.identifiant}')`)
  check(dossierA.length > 0 && dossierA[0].matricule !== r?.body?.matricule, 'dossier étudiant créé avec matricule final', dossierA[0]?.matricule)
  const [carteA] = await s.query(`SELECT COUNT(*) n FROM ins_cours_participants WHERE cursusApprenantId=${cursusA[0]?.id || 0}`)
  check(Number(carteA[0]?.n) === obligatoiresA.length, `cours_participants = cours obligatoires (${carteA[0]?.n})`)
  const [demandeValideeA] = await s.query(`SELECT dateValidation FROM ins_demandes_inscription WHERE id=${demandeIdA}`)
  check(demandeValideeA[0]?.dateValidation != null, 'demande validée (dateValidation renseignée)')

  // ═══════════ B. PARCOURS COMPLET — AVEC 1 COURS FACULTATIF (session n°4) ═══════════
  console.log('\n══════════ SCÉNARIO B — parcours complet, 1 cours facultatif (session ' + (sessionB?.id || '?') + ') ══════════')
  let tokenB = await creerCompte(CANDIDATS.B, s)
  await remplirProfil(tokenB, `B-${ts}`)

  r = await creerDemande(tokenB, sessionB?.id)
  if (![200, 201].includes(r.status)) { console.log('ABANDON B'); return }
  const demandeIdB = r.body.id

  r = await call('GET', `${BASE}/inscription/parcours`, { headers: { Authorization: 'Bearer ' + tokenB } })
  const listeParcoursB = Array.isArray(r.body) ? r.body : r.body?.data || []
  const parcoursB = listeParcoursB.find(p => p.id === 2) || listeParcoursB.filter(p => p.id !== parcoursA?.id)[0]
  r = await call('POST', `${BASE}/inscription/parcoursChoisis`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenB },
    body: JSON.stringify({ parcoursId: parcoursB?.id, demandeInscriptionId: demandeIdB, prerequisParcoursChoisis: [] })
  })
  log(`Choisir parcours #${parcoursB?.id} (${parcoursB?.titre})`, r)
  const parcoursChoisiIdB = r.body?.id
  await uploadDocs(tokenB, demandeIdB, dossiersB)

  await call('POST', `${BASE}/inscription/pre-inscriptions/${demandeIdB}/soumettre`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenB }, body: '{}'
  })
  await call('PUT', `${BASE}/inscription/pre-inscriptions/${demandeIdB}/valider`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
    body: JSON.stringify({ commentaire: 'OK test B' })
  })
  await call('PUT', `${BASE}/inscription/parcoursChoisis/${parcoursChoisiIdB}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
    body: JSON.stringify({ etatDeValidation: 'valide' })
  })
  r = await call('PUT', `${BASE}/inscription/parcoursChoisis/${parcoursChoisiIdB}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenB },
    body: JSON.stringify({ choixFinal: true })
  })
  log('Choix final B', r)

  // Cours du parcours B
  r = await call('GET', `${BASE}/inscription/cours?parcoursId=${parcoursB?.id}`, { headers: { Authorization: 'Bearer ' + tokenB } })
  const tousCoursB = Array.isArray(r.body) ? r.body : r.body?.data || []
  const facultatifsB = tousCoursB.filter(c => !c.estObligatoire)
  const obligatoiresB = tousCoursB.filter(c => c.estObligatoire)
  log('Cours du parcours B', r, `(${obligatoiresB.length} obligatoires / ${facultatifsB.length} facultatifs)`)

  r = await call('POST', `${BASE}/inscription/demandesInscription/${demandeIdB}/cours`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenB },
    body: JSON.stringify({ coursId: facultatifsB[0]?.id })
  })
  log('⚠️ FIX2: choix d\'un cours facultatif', r, `cours #${facultatifsB[0]?.id}`)
  check(r.status === 201, 'cours facultatif accepté (201)')

  const [choisisB] = await s.query(`SELECT cc.coursId, cc.etat, c.estObligatoire FROM ins_cours_choisis cc JOIN ins_cours c ON c.id=cc.coursId WHERE cc.demandeInscriptionId=${demandeIdB}`)
  check(choisisB.filter(x => x.estObligatoire).length === obligatoiresB.length, `cours obligatoires auto-ajoutés (${choisisB.filter(x => x.estObligatoire).length}/${obligatoiresB.length})`)
  check(choisisB.filter(x => !x.estObligatoire).length === 1, `1 seul cours facultatif choisi (${choisisB.filter(x => !x.estObligatoire).length})`)
  check(choisisB.every(x => x.etat === 'valide'), 'tous VALIDE')

  // Idempotence : re-POST du même cours facultatif -> alreadySignUp
  r = await call('POST', `${BASE}/inscription/demandesInscription/${demandeIdB}/cours`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenB },
    body: JSON.stringify({ coursId: facultatifsB[0]?.id })
  })
  log('Re-POST même cours facultatif (idempotence)', r)
  check(r.status === 400 && r.body?.alreadySignUp === true, 'doublon rejeté (alreadySignUp)')

  // Bordereau B + validation
  const fd2 = new FormData()
  fd2.append('fichier', new Blob([PDF], { type: 'application/pdf' }), 'bordereauB.pdf')
  fd2.append('type', 'inscription')
  fd2.append('montant', '0')
  r = await call('POST', `${BASE}/inscription/bordereaux`, { headers: { Authorization: 'Bearer ' + tokenB }, body: fd2 })
  const bordereauIdB = r.body?.id
  r = await call('PUT', `${BASE}/inscription/bordereaux/${bordereauIdB}/valider`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comptable },
    body: JSON.stringify({ commentaire: 'Paiement OK test B' })
  })
  log('Validation bordereau B (admission auto)', r)
  const [cursusB] = await s.query(`SELECT id FROM ins_cursus_apprenants WHERE demandeInscriptionId=${demandeIdB}`)
  const [cpB] = await s.query(`SELECT COUNT(*) n FROM ins_cours_participants WHERE cursusApprenantId=${cursusB[0]?.id || 0}`)
  check(Number(cpB[0]?.n) === obligatoiresB.length + 1, `cours_participants = obligatoires + 1 facultatif (${cpB[0]?.n})`)

  // ═══════════ C. SÉCURITÉ / RÉGRESSION ═══════════
  console.log('\n══════════ SCÉNARIO C — sécurité / régression ══════════')
  // C1. Double demande même session -> alreadySignUp
  r = await call('POST', `${BASE}/inscription/demandesInscription`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA },
    body: JSON.stringify({ dateDemande: new Date().toISOString(), sessionId: sessionA?.id })
  })
  log('C1. Double demande même session', r)
  check(r.status === 400 && r.body?.alreadySignUp === true, 'alreadySignUp OK')

  // C2. Apprenant A ne voit pas la demande de B (isolation)
  r = await call('GET', `${BASE}/inscription/demandesInscription/${demandeIdB}`, { headers: { Authorization: 'Bearer ' + tokenA } })
  log('C2. GET demande de B par l\'apprenant A', r)
  check(r.status === 404, 'accès interdit (404)')

  // C3. Un apprenant ne peut pas valider de bordereau (rôle cabinet comptable requis)
  r = await call('PUT', `${BASE}/inscription/bordereaux/${bordereauIdA}/valider`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA },
    body: JSON.stringify({ commentaire: 'x' })
  })
  log('C3. Apprenant tente de valider un bordereau', r)
  check(r.status === 403, '403 apprenant sur validation bordereau')

  // C4. Login (mot de passe) -> otpRequired (étape suivante du flux UI)
  r = await call('POST', `${BASE}/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CANDIDATS.A.email, motDePasse: 'Passw0rd!2026' })
  })
  log('C4. Login apprenant A', r)
  check(r.status === 200 && r.body?.otpRequired === true, 'login OK -> OTP requis (flux UI)')

  // C5. Verify-OTP code incorrect -> message explicite (validation du mécanisme)
  r = await call('POST', `${BASE}/auth/verify-otp`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CANDIDATS.A.email, code: '0000000000' })
  })
  log('C5. Verify-OTP code incorrect', r)
  check(r.status === 400 && (r.body?.error === 'code_incorrect' || r.body?.error === 'no_otp' || r.body?.error === 'code_expired'), 'OTP rejeté proprement', r.body?.error || '')

  // C6. GET demande 404 -> l'apprenant est redirigé (comportement front documenté)
  r = await call('GET', `${BASE}/inscription/demandesInscription/999999`, { headers: { Authorization: 'Bearer ' + tokenA } })
  log('C6. GET demande inexistante', r)
  check(r.status === 404, '404 propre')

  await s.close()

  console.log('\n══════════════════════════════════════════════════════════')
  console.log(` RÉSULTAT : ${PASS} ✅ | ${FAIL} ❌`)
  console.log('══════════════════════════════════════════════════════════')
  process.exit(FAIL > 0 ? 1 : 0)
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1) })
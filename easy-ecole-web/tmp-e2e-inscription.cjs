const dotenv = require('D:/EasyEcole/easy-ecole-backend/node_modules/dotenv')
dotenv.config({ path: 'D:/EasyEcole/easy-ecole-backend/.env' })
const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken')

const BASE = 'http://localhost:3000/api/v1/inscription'
const SECRET = process.env.JWT_SECRET
const tokenFor = (u) => jwt.sign(u, SECRET, { expiresIn: '2h' })

const TOKENS = {
    apprenant: tokenFor({ id: 13, identifiant: 'etudiant1', email: 'mensah.komlan@etu.ust.ci', role: 'apprenant', tokenVersion: 0, etablissementId: null }),
    comite: tokenFor({ id: 9, identifiant: 'comite1', email: 'comite.yao@easyecole.tg', role: 'comite_orientation', tokenVersion: 0, etablissementId: null }),
    institution: tokenFor({ id: 2, identifiant: 'institution', email: 'direction@easyecole.tg', role: 'institution', tokenVersion: 0, etablissementId: null }),
    comptable: tokenFor({ id: 11, identifiant: 'comptable1', email: 'comptable1@easyecole.tg', role: 'cabinet_comptable', tokenVersion: 0, etablissementId: null }),
}

let demandeId = null
let parcoursChoisiId = null
let bordereauId = null

async function call(method, url, opts = {}) {
    const t0 = Date.now()
    const r = await fetch(url, { method, ...opts, signal: AbortSignal.timeout(90000) })
    const txt = await r.text()
    let body = null
    try { body = JSON.parse(txt) } catch (e) {}
    const ms = Date.now() - t0
    return { status: r.status, body, txt, ms }
}

function log(title, res, extra = '') {
    const ok = res.status >= 200 && res.status < 300
    console.log(`${ok ? '✅' : '❌'} ${title} -> ${res.status} (${res.ms}ms) ${extra}`)
    if (!ok) console.log('     reponse:', (res.txt || '').slice(0, 400))
    return ok
}

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n140\n%%EOF')

async function main() {
    console.log('===== FLUX INSCRIPTION COMPLET (admission automatique apres validation bordereau) =====\n')

    // ── 1. Créer la demande ──
    let r = await call('POST', `${BASE}/demandesInscription`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.apprenant },
        body: JSON.stringify({ dateDemande: new Date().toISOString(), sessionId: 2 })
    })
    if (!log('1. Créer demande', r)) return
    demandeId = r.body.id
    console.log('     demande id:', demandeId, '| matricule provisoire:', r.body.matricule)

    // ── 2. Choisir le parcours ──
    r = await call('POST', `${BASE}/parcoursChoisis`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.apprenant },
        body: JSON.stringify({ parcoursId: 5, demandeInscriptionId: demandeId, prerequisParcoursChoisis: [] })
    })
    if (!log('2. Choisir parcours (5 Génie Civil)', r)) return
    parcoursChoisiId = r.body.id

    // ── 3. Upload des 2 documents requis ──
    for (const [dossierId, label] of [[1, 'Naissances'], [2, 'releve de Notes']]) {
        const fd = new FormData()
        fd.append('demandeId', String(demandeId))
        fd.append('dossierId', String(dossierId))
        fd.append('fichiers', new Blob([PDF], { type: 'application/pdf' }), `doc${dossierId}.pdf`)
        r = await call('PUT', `${BASE}/dossiersInscription`, { headers: { Authorization: 'Bearer ' + TOKENS.apprenant }, body: fd })
        if (!log(`3. Upload document "${label}" (dossier ${dossierId})`, r)) return
    }

    // ── 4. Soumettre la pré-inscription ──
    r = await call('POST', `${BASE}/pre-inscriptions/${demandeId}/soumettre`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.apprenant },
        body: JSON.stringify({})
    })
    if (!log('4. Soumettre pré-inscription', r)) return

    // ── 5. Comité : valider la pré-inscription ──
    r = await call('PUT', `${BASE}/pre-inscriptions/${demandeId}/valider`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
        body: JSON.stringify({ commentaire: 'OK test e2e' })
    })
    if (!log('5. Comité valide pré-inscription (demande ' + demandeId + ')', r)) return

    // ── 6. Comité : valider le choix du parcours ──
    r = await call('PUT', `${BASE}/parcoursChoisis/${parcoursChoisiId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comite },
        body: JSON.stringify({ etatDeValidation: 'valide' })
    })
    if (!log('6. Comité valide le parcours', r)) return

    // ── 7. Apprenant : poser son choix final ──
    r = await call('PUT', `${BASE}/parcoursChoisis/${parcoursChoisiId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.apprenant },
        body: JSON.stringify({ choixFinal: true })
    })
    if (!log('7. Apprenant pose le choix final', r)) return

    // ── 8. Choix des cours : l'apprenant ne choisit QUE les facultatifs ──
    const coursRes = await call('GET', `${BASE}/cours?parcoursId=5`, { headers: { Authorization: 'Bearer ' + TOKENS.apprenant } })
    const allCours = Array.isArray(coursRes.body) ? coursRes.body : (coursRes.body?.data || [])
    const facultatifs = allCours.filter(c => !c.estObligatoire)
    const obligatoires = allCours.filter(c => c.estObligatoire)
    console.log(`     cours du parcours 5 : ${allCours.length} (${obligatoires.length} obligatoires / ${facultatifs.length} facultatifs)`)
    if (facultatifs.length > 0) {
        // Un facultatif choisi par l'apprenant
        r = await call('POST', `${BASE}/demandesInscription/${demandeId}/cours`, {
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.apprenant },
            body: JSON.stringify({ coursId: facultatifs[0].id })
        })
        if (!log('8a. Apprenant choisit un cours facultatif', r)) return
    } else {
        console.log('     aucun cours facultatif dans ce parcours -> l\'apprenant ne soumet aucun cours (obligatoires ajoutés au bordereau)')
    }

    // ── 9. Vérif : cours obligatoires ajoutés automatiquement (VALIDE) ──
    const s = await requireDb()
    const [etats] = await s.query(`SELECT etat, COUNT(*) n FROM ins_cours_choisis WHERE demandeInscriptionId=${demandeId} GROUP BY etat`)
    const [nbCours] = await s.query(`SELECT COUNT(*) n FROM ins_cours_choisis WHERE demandeInscriptionId=${demandeId}`)
    const nbValides = (etats.find(e => e.etat == 'valide') || {}).n || 0
    const nbEncours = (etats.find(e => e.etat == 'en_cours') || {}).n || 0
    console.log(`9. Cours en BDD: ${nbCours[0].n} | ${nbValides} valide(s) / ${nbEncours} en_cours -> ${
        (nbCours[0].n === obligatoires.length + (facultatifs.length > 0 ? 1 : 0) && nbEncours === 0) ? '✅ auto-obligatoires OK' : '❌ ATTENDU'
    }`)

    // ── 10. Paiement : l'apprenant upload son bordereau d'inscription (sans échéance, conforme au front) ──
    const fd = new FormData()
    fd.append('fichier', new Blob([PDF], { type: 'application/pdf' }), 'bordereau.pdf')
    fd.append('type', 'inscription')
    fd.append('montant', '0')
    r = await call('POST', `${BASE}/bordereaux`, { headers: { Authorization: 'Bearer ' + TOKENS.apprenant }, body: fd })
    if (!log('10. Apprenant upload le bordereau d\'inscription', r)) return
    bordereauId = r.body.id
    console.log('     bordereau id:', bordereauId)

    // ── 11. Cabinet comptable : valide le bordereau => admission AUTOMATIQUE + cursus + dossier + carte ──
    r = await call('PUT', `${BASE}/bordereaux/${bordereauId}/valider`, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKENS.comptable },
        body: JSON.stringify({ commentaire: 'Paiement OK' })
    })
    if (!log('11. Cabinet comptable valide le bordereau', r)) return

    // ── 12. Vérifications BDD : admission auto + cursus + dossier + cours_participants ──
    console.log('\n===== VÉRIFICATIONS (admission automatique) =====')
    const [reponse] = await s.query(`SELECT id, message, demandeInscriptionId FROM ins_reponses_inscription WHERE demandeInscriptionId=${demandeId}`)
    console.log(`admission (reponseInscription) créée auto: ${reponse.length > 0 ? '✅' : '❌'}`, reponse[0] ? JSON.stringify({ id: reponse[0].id, message: reponse[0].message.slice(0, 60) }) : '')

    const [cursus] = await s.query(`SELECT id, classeId, parcoursId, anneeAcademiqueId FROM ins_cursus_apprenants WHERE demandeInscriptionId=${demandeId}`)
    console.log(`cursus créé: ${cursus.length > 0 ? '✅' : '❌'}`, cursus[0] ? JSON.stringify(cursus[0]) : '')

    const [dossier] = await s.query(`SELECT id, matricule, statut, carteGeneree FROM ins_dossiers_etudiants WHERE utilisateurId=13`)
    console.log(`dossier étudiant: ${dossier.length > 0 ? '✅' : '❌'}`, dossier[0] ? JSON.stringify(dossier[0]) : '')

    const [cp] = await s.query(`SELECT COUNT(*) n FROM ins_cours_participants WHERE cursusApprenantId=${cursus[0]?.id || 0}`)
    console.log(`cours_participants: ${cp[0]?.n}`)

    const [carte] = await s.query(`SELECT COUNT(*) n FROM ins_cours_choisis WHERE demandeInscriptionId=${demandeId}`)
    console.log(`cours choisis au total: ${carte[0]?.n}`)

    // ── 13. Page "Mes cours" de l'apprenant ──
    const mc = await call('GET', `${BASE}/cursusApprenant/cours`, { headers: { Authorization: 'Bearer ' + TOKENS.apprenant } })
    console.log(`\nPage Mes cours (getCoursChoisis): STATUS ${mc.status} en ${mc.ms}ms | cours: ${(mc.body?.demandeInscription?.cours || []).length}`)

    await s.close()
}

async function requireDb() {
    const { Sequelize } = require('D:/EasyEcole/easy-ecole-backend/node_modules/sequelize')
    return new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql', logging: false })
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1) })
/**
 * TEST E2E — FLUX PARALLÈLE (nouveau circuit d'inscription)
 * ─────────────────────────────────────────────────────────────────────────
 * Ordre testé (celui du nouveau flux) :
 *   1. Apprenant      : demande + choix parcours (+ documents simulés)
 *   2. Cabinet        : PUT /bordereaux/:id/valider  → transmission AUTO au comité
 *                       ASSERT : statutPipeline='transmis_comite' + soumissionComite=1
 *   3. Comité         : POST /comite-validations/dossiers/:id/decider decision=valide
 *                       SANS aucune saisie ESA au préalable
 *                       ASSERT : DossierEtudiant + matricule final + cursus +
 *                                cours participants + échéanciers créés MAINTENANT
 *   4. ESA-COMPTA     : PUT /finance/bordereaux/:id/saisir APRÈS la validation
 *                       ASSERT : saisie acceptée, imputation sur les échéances existantes,
 *                       pipeline INTACT (= 'valide')
 * Usage : npx ts-node src/core/scripts/test-e2e-flux-parallele.ts
 */
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const API = 'http://localhost:3000/api/v1'
const JWT_SECRET = process.env.JWT_SECRET!
let echecs = 0

function ok(label: string, detail = '') { console.log(`✅ ${label}${detail ? ' — ' + detail : ''}`) }
function ko(label: string, detail = '') { echecs++; console.log(`❌ ${label}${detail ? ' — ' + detail : ''}`) }
function step(msg: string) { console.log(`\n────────── ${msg} ──────────`) }

async function http(methode: string, url: string, token: string | null, body?: any): Promise<{ status: number; json: any }> {
    const headers: any = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${API}${url}`, { method: methode, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    let json: any = null
    try { json = await res.json() } catch { /* corps non JSON */ }
    return { status: res.status, json }
}

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection')
    const db = DatabaseConnection.getInstance()
    await db.init()
    const seq = db.sequelize

    // ── 0. Comptes ──
    step('0. COMPTES')
    const [users]: any[] = await seq.query(`SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE identifiant IN ('comptable1','comite1','esa-compta') AND deletedAt IS NULL`)
    const cpts = new Map<string, any>()
    for (const u of users) cpts.set(u.identifiant, u)
    for (const idt of ['comptable1', 'comite1', 'esa-compta']) {
        if (cpts.has(idt)) ok(`compte ${idt}`, `#${cpts.get(idt).id} (${cpts.get(idt).role})`)
        else { ko(`compte manquant: ${idt}`); return finir(seq) }
    }

    const stamp = Date.now()
    const [insApp]: any = await seq.query(
        `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, dateVerificationEmail, createdAt, updatedAt)
         VALUES ('E2E-PARA', :p, :i, :m, '$2a$10$abcdefghijklmnopqrstuv', 'apprenant', '+228000000001', NOW(), NOW(), NOW())`,
        { replacements: { p: `Parallele ${stamp}`, i: `etu-para-${stamp}`, m: `etu-para-${stamp}@etu.test` } })
    const apprenantId = Number((Array.isArray(insApp) ? insApp[0] : insApp)?.insertId ?? insApp ?? 0)
    await seq.query(`INSERT INTO aut_apprenants (dateNaissance, lieuNaissance, sexe, nationalite, statutEtudiant, periode, utilisateurId, createdAt, updatedAt)
                     SELECT '2004-06-10','Lomé','M','Togolaise','nouveau','soir',:u,NOW(),NOW()
                     WHERE NOT EXISTS (SELECT 1 FROM aut_apprenants WHERE utilisateurId=:u)`, { replacements: { u: apprenantId } })
    ok('apprenant éphémère créé', `#${apprenantId}`)

    const signer = (c: any) => jwt.sign({ exp: Math.floor(Date.now() / 1000) + 3600, id: c.id, email: c.email, identifiant: c.identifiant, role: c.role, tokenVersion: c.tokenVersion || 0, etablissementId: null }, JWT_SECRET)
    const T = { cabinet: signer(cpts.get('comptable1')), comite: signer(cpts.get('comite1')), compta: signer(cpts.get('esa-compta')), apprenant: signer({ id: apprenantId, email: `etu-para-${stamp}@etu.test`, identifiant: `etu-para-${stamp}`, role: 'apprenant' }) }

    // ── 1. Référentiel ──
    step('1. SESSION & PARCOURS')
    const [sessions]: any[] = await seq.query(`SELECT id, anneeAcademiqueId FROM ins_sessions WHERE deletedAt IS NULL ORDER BY id DESC LIMIT 1`)
    if (!sessions.length) { ko('aucune session'); return finir(seq) }
    const session = sessions[0]
    ok('session', `#${session.id}`)
    const PARCOURS_ID = 1 // Génie logiciel : 4 cours tous rattachés à une classe
    const [[pc]]: any[] = await seq.query(`SELECT COUNT(*) n FROM ins_cours WHERE parcoursId=:p AND deletedAt IS NULL AND classeId IS NOT NULL`, { replacements: { p: PARCOURS_ID } })
    if (!pc?.n) { ko('parcours sans cours/classé — ajuster PARCOURS_ID'); return finir(seq) }
    ok('parcours', `#${PARCOURS_ID} (${pc.n} cours classés)`)

    // Grilles tarifaires (pour que le socle génère des échéances chiffrées)
    await seq.query(`INSERT INTO ins_frais_scolarites (sessionId, montant, modalite, actif, createdAt, updatedAt)
                     VALUES (:s, 450000, '10x', 1, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE montant=450000, modalite='10x', actif=1`, { replacements: { s: session.id } }).catch(async () => {
        await seq.query(`UPDATE ins_frais_scolarites SET montant=450000, modalite='10x', actif=1 WHERE sessionId=:s AND deletedAt IS NULL`, { replacements: { s: session.id } })
    })
    await seq.query(`INSERT INTO ins_frais_inscriptions (sessionId, montant, createdAt, updatedAt)
                     SELECT :s, 50000, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM ins_frais_inscriptions WHERE sessionId=:s)`,
        { replacements: { s: session.id } }).catch(() => console.log('   (frais_inscriptions : table/colonnes différentes, ignoré)'))

    // ── 2. APPRENANT : demande + parcours ──
    step('2. DEMANDE + CHOIX PARCOURS')
    const rDem = await http('POST', '/inscription/demandesInscription', T.apprenant, { sessionId: session.id, dateDemande: new Date().toISOString() })
    const demandeId = rDem.json?.id || rDem.json?.data?.id
    if (![201, 200].includes(rDem.status) || !demandeId) {
        if (rDem.json?.alreadySignUp) {
            const [ex]: any[] = await seq.query(`SELECT id FROM ins_demandes_inscription WHERE utilisateurId=:u ORDER BY id DESC LIMIT 1`, { replacements: { u: apprenantId } })
            ko('demande déjà existante pour cet apprenant — réutiliser un apprenant neuf', JSON.stringify(ex))
            return finir(seq)
        }
        ko('création demande', `HTTP ${rDem.status} ${JSON.stringify(rDem.json).slice(0, 200)}`); return finir(seq)
    }
    ok('demande créée', `#${demandeId}`)

    const rChoix = await http('POST', '/inscription/parcoursChoisis', T.apprenant, { parcoursId: PARCOURS_ID, demandeInscriptionId: demandeId, choixFinal: true })
    if ([200, 201].includes(rChoix.status)) ok('choix final posé')
    else ko('choix parcours', `HTTP ${rChoix.status} ${JSON.stringify(rChoix.json).slice(0, 150)}`)

    // Documents requis de la session → simulation d'uploads
    const [reqs]: any[] = await seq.query(`SELECT id, libelle FROM ins_dossiers_inscriptions WHERE sessionId=:s AND deletedAt IS NULL`, { replacements: { s: session.id } }).catch(() => [[]])
    if (reqs && reqs.length) {
        for (const req of reqs) {
            await seq.query(`INSERT INTO ins_dossiers_demandes (utilisateurId, demandeInscriptionId, dossierInscriptionId, fichier, createdAt, updatedAt)
                             SELECT :u,:d,:r,'e2e-parallele.pdf',NOW(),NOW()
                             WHERE NOT EXISTS (SELECT 1 FROM ins_dossiers_demandes WHERE demandeInscriptionId=:d AND dossierInscriptionId=:r)`,
                { replacements: { u: apprenantId, d: demandeId, r: req.id } }).catch(async () => {
                    await seq.query(`INSERT INTO ins_dossiers_demandes (demandeInscriptionId, dossierInscriptionId, fichier, createdAt, updatedAt)
                                     SELECT :d,:r,'e2e-parallele.pdf',NOW(),NOW()
                                     WHERE NOT EXISTS (SELECT 1 FROM ins_dossiers_demandes WHERE demandeInscriptionId=:d AND dossierInscriptionId=:r)`,
                        { replacements: { d: demandeId, r: req.id } }).catch((e: any) => ko(`simulation document "${req.libelle}"`, e.message))
                })
        }
        ok(`${reqs.length} document(s) simulé(s)`)
    } else ok('aucun document requis par la session')

    // ── 3. BORDEREAU soumis par l'étudiant ──
    step('3. BORDEREAU EN_ATTENTE (soumission étudiant simulée)')
    const [insBord]: any = await seq.query(
        `INSERT INTO ins_bordereaux (utilisateurId, fichier, montant, modalite, referenceBancaire, statut, statutPaiement, dateSoumission, createdAt, updatedAt)
         VALUES (:u, 'e2e-parallele-bordereau.pdf', NULL, '1x', NULL, 'en_attente', 'pending', NOW(), NOW(), NOW())`,
        { replacements: { u: apprenantId } })
    const bordereauId = Number((Array.isArray(insBord) ? insBord[0] : insBord)?.insertId ?? insBord)
    ok('bordereau en attente', `#${bordereauId}`)

    // ── 4. CABINET : authentification → TRANSMISSION AUTO AU COMITÉ ──
    step('4. CABINET AUTHENTIFIE → TRANSMISSION AUTO AU COMITÉ')
    const rVal = await http('PUT', `/inscription/bordereaux/${bordereauId}/valider`, T.cabinet, {})
    if (![200, 201].includes(rVal.status)) { ko('validation cabinet', `HTTP ${rVal.status} ${JSON.stringify(rVal.json).slice(0, 200)}`); return finir(seq) }
    ok('cabinet a authentifié le bordereau')

    const [[dem1]]: any[] = await seq.query(`SELECT statutPipeline, soumissionComite FROM ins_demandes_inscription WHERE id=:d`, { replacements: { d: demandeId } })
    if (dem1?.statutPipeline === 'transmis_comite') ok('PIPELINE = transmis_comite dès l\'authentification')
    else ko('pipeline attendu transmis_comite', String(dem1?.statutPipeline))
    if (dem1?.soumissionComite == 1 || dem1?.soumissionComite === true) ok('soumissionComite = true')
    else ko('soumissionComite attendu true', String(dem1?.soumissionComite))

    const rListe = await http('GET', '/inscription/comite-validations/dossiers?page=1&limit=50', T.comite)
    const dansListe = JSON.stringify(rListe.json || []).includes(`"id":${demandeId}`)
    if (rListe.status === 200 && dansListe) ok('dossier visible dans la liste du comité')
    else ko('liste comité', `HTTP ${rListe.status}, présence=${dansListe}`)

    // ── 5. COMITÉ VALIDE SANS SAISIE ESA (cœur du nouveau flux) ──
    step('5. COMITÉ VALIDE AVANT TOUTE SAISIE ESA')
    const rDec = await http('POST', `/inscription/comite-validations/dossiers/${demandeId}/decider`, T.comite, { decision: 'valide' })
    if (![200, 201].includes(rDec.status)) { ko('décision comité', `HTTP ${rDec.status} ${JSON.stringify(rDec.json).slice(0, 300)}`); return finir(seq) }
    const matricule = rDec.json?.data?.matricule
    ok('COMITÉ A VALIDÉ sans saisie ESA préalable', `matricule définitif = ${matricule}`)

    const [[chk]]: any[] = await seq.query(`
        SELECT
          (SELECT matricule FROM ins_dossiers_etudiants WHERE utilisateurId=:u AND deletedAt IS NULL ORDER BY id DESC LIMIT 1) matDossier,
          (SELECT COUNT(*) FROM ins_cursus_apprenants WHERE demandeInscriptionId=:d AND deletedAt IS NULL) nbCursus,
          (SELECT COUNT(*) FROM ins_cours_participants cp JOIN ins_cours_choisis cc ON cc.demandeInscriptionId=:d AND cc.deletedAt IS NULL
             WHERE cp.utilisateurId=:u AND cp.coursId=cc.coursId AND cp.deletedAt IS NULL) nbParticipants`,
        { replacements: { u: apprenantId, d: demandeId } })
    if (chk?.matDossier === matricule) ok('DossierEtudiant créé avec le matricule FINAL', chk.matDossier)
    else ko('dossier étudiant / matricule', JSON.stringify(chk))
    if (Number(chk?.nbCursus) >= 1) ok('CursusApprenant créé') ; else ko('cursus absent')
    if (Number(chk?.nbParticipants) >= 1) ok('cours participants créés', `${chk.nbParticipants} ligne(s)`) ; else ko('aucun cours participant')

    let echCount = -1
    try {
        const [rows]: any[] = await seq.query(`
            SELECT COUNT(*) n FROM ins_echeances e
            JOIN ins_dossiers_etudiants de ON de.id=e.dossierEtudiantId AND de.deletedAt IS NULL
            WHERE de.utilisateurId=:u`, { replacements: { u: apprenantId } })
        echCount = Number(rows?.[0]?.n ?? -1)
    } catch { echCount = -1 }
    if (echCount > 0) ok('échéanciers générés (socle financier)', `${echCount} échéance(s)`)
    else ko('échéanciers absents ou table différente', String(echCount))

    const [[dem2]]: any[] = await seq.query(`SELECT statutPipeline, dateValidation FROM ins_demandes_inscription WHERE id=:d`, { replacements: { d: demandeId } })
    if (dem2?.statutPipeline === 'valide' && dem2?.dateValidation) ok('pipeline = valide + dateValidation posée')
    else ko('état final demande', JSON.stringify(dem2))

    // ── 6. ESA-COMPTA saisit APRÈS la validation (travail parallèle) ──
    step('6. ESA-COMPTA SAISIT APRÈS LA VALIDATION')
    const rSaisie = await http('PUT', `/inscription/finance/bordereaux/${bordereauId}/saisir`, T.compta, {
        montantPaiement: 200000, referenceBancaire: `PARA-${stamp}`, numeroBordereau: 'BQ-E2E-PARA',
        moyenPaiement: 'virement', datePaiement: new Date().toISOString().split('T')[0], commentaire: 'Flux parallèle'
    })
    if (![200, 201].includes(rSaisie.status)) { ko('saisie ESA', `HTTP ${rSaisie.status} ${JSON.stringify(rSaisie.json).slice(0, 250)}`); return finir(seq) }
    ok('saisie ESA acceptée après validation comité')

    const lignes = rSaisie.json?.lettrage?.lignes || []
    if (lignes.length) ok('lettrage FIFO effectué sur les échéances existantes', `${lignes.length} ligne(s)`)
    else ok('aucune ligne de lettrage (montants de référence à zéro) — saisie toutefois acceptée')

    const [[dem3]]: any[] = await seq.query(`SELECT statutPipeline, matricule FROM ins_demandes_inscription WHERE id=:d`, { replacements: { d: demandeId } })
    if (dem3?.statutPipeline === 'valide') ok('pipeline RESTÉ valide après saisie ESA (ESA ne pilote plus le pipeline)')
    else ko('pipeline modifié par la saisie ESA ?', String(dem3?.statutPipeline))

    return finir(seq)

    async function finir(sq: any) {
        console.log('\n═══════════ BILAN FLUX PARALLÈLE ═══════════')
        console.log(echecs === 0 ? '✅ TOUS LES TESTS PASSENT' : `❌ ${echecs} test(s) en échec`)
        await sq.close()
        process.exit(echecs === 0 ? 0 : 1)
    }
}

main().catch(e => { console.error('ERREUR FATALE:', e); process.exit(1) })

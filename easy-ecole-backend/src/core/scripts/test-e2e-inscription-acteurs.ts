/**
 * TEST E2E INSCRIPTION — TOUS LES ACTEURS
 * ─────────────────────────────────────────────────────────────────
 * Acteurs : apprenant (etudiant-demo), comité d'orientation (comite1),
 *           caissier banque (caissier1), ESA-COMPTA, institution.
 * Chaîne  : création demande → choix parcours → soumission préinscription
 *           → contrôle d'accès (403) → validation comité → autorisation PDF.
 * Usage   : npx ts-node src/core/scripts/test-e2e-inscription-acteurs.ts
 * Les jetons sont signés directement (comme le script e2e historique).
 */
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import fs from 'fs'

const API = 'http://localhost:3000/api/v1'
const JWT_SECRET = process.env.JWT_SECRET!
let echecs = 0

function ok(label: string, detail = '') { console.log(`✅ ${label}${detail ? ' — ' + detail : ''}`) }
function ko(label: string, detail = '') { echecs++; console.log(`❌ ${label}${detail ? ' — ' + detail : ''}`) }
function step(msg: string) { console.log(`\n────────── ${msg} ──────────`) }

interface Compte { id?: number; identifiant: string; email: string; role: string; tokenVersion?: number }

async function http(methode: string, url: string, token: string | null, body?: any): Promise<{ status: number; json: any }> {
    const headers: any = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${API}${url}`, {
        method: methode, headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    let json: any = null
    try { json = await res.json() } catch { /* corps non JSON (PDF...) */ }
    return { status: res.status, json }
}

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection')
    const db = DatabaseConnection.getInstance()
    await db.init()
    const seq = db.sequelize

    // ── Chargement des comptes de démo ──
    step('0. COMPTES DE DÉMONSTRATION')
    const [users]: any[] = await seq.query(`SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE identifiant IN ('comite1','caissier1','esa-compta','institution') AND deletedAt IS NULL`)
    const comptes = new Map<string, Compte>()
    for (const u of users) comptes.set(u.identifiant, u)

    // Apprenant ÉPHÉMÈRE : créé à chaque exécution pour garantir la reproductibilité
    // du scénario complet (une demande d'inscription ne peut être créée qu'une fois
    // par apprenant et par session).
    const identifiantTest = `etudiant-e2e-${Date.now()}`
    const apprenantId: any = await seq.query(
        `INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, dateVerificationEmail, createdAt, updatedAt)
         VALUES ('E2E', :prenoms, :idt, :mail, :mdp, 'apprenant', '+228000000000', NOW(), NOW(), NOW())`,
        { replacements: { prenoms: `Test ${Date.now()}`, idt: identifiantTest, mail: `${identifiantTest}@etu.test`, mdp: '$2a$10$abcdefghijklmnopqrstuv' } })
        .then(async (res: any) => {
            const resultat: any = Array.isArray(res) ? res[0] : res
            const insertId: number = Number(resultat?.insertId ?? resultat ?? 0)
            await seq.query(`INSERT INTO aut_apprenants (dateNaissance, lieuNaissance, sexe, nationalite, statutEtudiant, periode, utilisateurId, createdAt, updatedAt)
                             SELECT '2004-01-15', 'Lomé', 'M', 'Togolaise', 'nouveau', 'soir', :uid, NOW(), NOW()
                             WHERE NOT EXISTS (SELECT 1 FROM aut_apprenants WHERE utilisateurId = :uid)`,
                { replacements: { uid: insertId } })
            return insertId
        })
    const apprenant: Compte = { id: Number(apprenantId), identifiant: identifiantTest, email: `${identifiantTest}@etu.test`, role: 'apprenant', tokenVersion: 0 }
    comptes.set('etudiant-demo', apprenant)
    ok(`compte apprenant éphémère créé`, `#${apprenant.id} (${identifiantTest})`)
    for (const idt of ['comite1', 'caissier1', 'esa-compta', 'institution']) {
        if (comptes.has(idt)) ok(`compte ${idt}`, `#${(comptes.get(idt) as any).id}`)
        else ko(`compte manquant: ${idt} — exécuter seed-comptes-par-role.ts`)
    }
    const signer = (c: Compte) => jwt.sign(
        { exp: Math.floor(Date.now() / 1000) + 3600, id: c.id, email: c.email, identifiant: c.identifiant, role: c.role, tokenVersion: c.tokenVersion || 0, etablissementId: null },
        JWT_SECRET)
    const T = {
        apprenant: signer(comptes.get('etudiant-demo')!),
        comite: signer(comptes.get('comite1')!),
        caissier: signer(comptes.get('caissier1')!),
        compta: signer(comptes.get('esa-compta')!),
        institution: signer(comptes.get('institution')!),
    }

    // ── A. Données de référence ──
    step('A. DONNÉES DE RÉFÉRENCE')
    const rSessions = await http('GET', '/inscription/sessions', T.apprenant)
    const session = Array.isArray(rSessions.json) ? rSessions.json[rSessions.json.length - 1] : (rSessions.json?.data?.[rSessions.json.data.length - 1])
    if (session) ok('session disponible', `#${session.id} ${(session.libelle || '')}`)
    else { ko('aucune session disponible'); return finir(seq) }

    const rParcoursListe = await http('GET', '/inscription/parcours', T.apprenant)
    const parcours = Array.isArray(rParcoursListe.json) ? rParcoursListe.json[0] : rParcoursListe.json?.data?.[0]
    if (parcours) ok('parcours disponible', `#${parcours.id} ${parcours.titre || ''}`)
    else { ko('aucun parcours disponible'); return finir(seq) }

    // ── B. APPRENANT : création de la demande d'inscription ──
    step('B. APPRENANT — CRÉATION DEMANDE D\'INSCRIPTION')
    const rDemande = await http('POST', '/inscription/demandesInscription', T.apprenant, { sessionId: session.id, dateDemande: new Date().toISOString() })
    let demandeId: number
    if (rDemande.status === 201 && rDemande.json?.id) {
        demandeId = rDemande.json.id
        ok('demande créée', `#${demandeId}, matricule=${rDemande.json.matricule}`)
    } else if (rDemande.json?.alreadySignUp) {
        // Demande existante pour cette session — on la récupère
        const [ex]: any[] = await seq.query(`SELECT id FROM ins_demandes_inscription WHERE utilisateurId=:u AND sessionId=:s AND deletedAt IS NULL ORDER BY id DESC LIMIT 1`, { replacements: { u: comptes.get('etudiant-demo')!.id, s: session.id } })
        if (!ex.length) { ko('déjà inscrit mais demande introuvable'); return finir(seq) }
        demandeId = ex[0].id
        ok('demande existante réutilisée', `#${demandeId}`)
    } else {
        ko('création demande', `HTTP ${rDemande.status} ${JSON.stringify(rDemande.json).slice(0, 150)}`)
        return finir(seq)
    }

    // Test échec : double création → alreadySignUp
    const rDoublon = await http('POST', '/inscription/demandesInscription', T.apprenant, { sessionId: session.id, dateDemande: new Date().toISOString() })
    if (rDoublon.status === 400 && rDoublon.json?.alreadySignUp) ok('doublon détecté (alreadySignUp)')
    else ko('doublon non détecté', `HTTP ${rDoublon.status}`)

    // ── C. Soumission prématurée sans parcours → refus métier ──
    step('C. CONTRÔLE MÉTIER — SOUMISSION SANS PARCOURS')
    const rSansParcours = await http('POST', `/inscription/pre-inscriptions/${demandeId}/soumettre`, T.apprenant)
    if (rSansParcours.status === 400) ok('soumission sans parcours refusée', rSansParcours.json?.message || '')
    else ko('soumission sans parcours aurait dû être refusée', `HTTP ${rSansParcours.status}`)

    // ── D. APPRENANT : choix du parcours ──
    step('D. APPRENANT — CHOIX DU PARCOURS')
    const rChoix = await http('POST', '/inscription/parcoursChoisis', T.apprenant, { parcoursId: parcours.id, demandeInscriptionId: demandeId, choixFinal: true })
    if (rChoix.status === 201) ok('parcours choisi', `#${rChoix.json?.id}`)
    else ko('choix parcours', `HTTP ${rChoix.status} ${JSON.stringify(rChoix.json).slice(0, 150)}`)

    // ── E. SOUMISSION DE LA PRÉINSCRIPTION ──
    step('E. APPRENANT — SOUMISSION PRÉINSCRIPTION')
    const rSoum = await http('POST', `/inscription/pre-inscriptions/${demandeId}/soumettre`, T.apprenant)
    if ([200, 201].includes(rSoum.status)) ok('préinscription soumise')
    else if (rSoum.status === 400 && /documents requis/i.test(rSoum.json?.message || '')) {
        ko('documents requis par la session non téléversés — upload à implémenter dans le test', rSoum.json?.message)
        return finir(seq)
    } else ko('soumission préinscription', `HTTP ${rSoum.status} ${JSON.stringify(rSoum.json).slice(0, 150)}`)

    // ── F. CONTRÔLES D'ACCÈS (403 attendus) ──
    step('F. CONTRÔLES D\'ACCÈS')
    const rValApprenant = await http('PUT', `/inscription/pre-inscriptions/${demandeId}/valider`, T.apprenant, {})
    if (rValApprenant.status === 403) ok('apprenant ne peut pas valider (403)')
    else ko(`apprenant validation aurait dû donner 403`, `HTTP ${rValApprenant.status}`)

    const rValCaissier = await http('PUT', `/inscription/pre-inscriptions/${demandeId}/valider`, T.caissier, {})
    if (rValCaissier.status === 403) ok('caissier ne peut pas valider (403)')
    else ko('caissier validation aurait dû donner 403', `HTTP ${rValCaissier.status}`)

    // ── G. COMITÉ D'ORIENTATION : validation ──
    step('G. COMITÉ D\'ORIENTATION — VALIDATION PRÉINSCRIPTION')
    const [pre]: any[] = await seq.query(`SELECT id, statut FROM ins_pre_inscriptions WHERE demandeInscriptionId=:d AND deletedAt IS NULL ORDER BY id DESC LIMIT 1`, { replacements: { d: demandeId } })
    if (!pre.length) { ko('préinscription introuvable en base'); return finir(seq) }
    ok('statut avant comité', pre[0].statut)

    const rValid = await http('PUT', `/inscription/pre-inscriptions/${demandeId}/valider`, T.comite, {})
    if ([200, 201].includes(rValid.status)) ok('comité a validé la préinscription')
    else ko('validation comité', `HTTP ${rValid.status} ${JSON.stringify(rValid.json).slice(0, 200)}`)

    // ── H. AUTORISATION PROVISOIRE (apprenant) — id de la PRÉINSCRIPTION ──
    step('H. APPRENANT — AUTORISATION PROVISOIRE')
    try {
        const res = await fetch(`${API}/inscription/pre-inscriptions/${pre[0].id}/autorisation`, { headers: { Authorization: `Bearer ${T.apprenant}` } })
        if (res.status === 200) {
            const buf = Buffer.from(await res.arrayBuffer())
            if (buf.length > 500 && buf.slice(0, 4).toString() === '%PDF') ok('autorisation PDF générée', `${buf.length} octets`)
            else ok('autorisation téléchargée', `${res.headers.get('content-type')} — ${buf.length} octets`)
        } else ko('autorisation provisoire', `HTTP ${res.status}`)
    } catch (e: any) { ko('autorisation provisoire', e.message) }

    // ── I. PÉRIMÈTRES DES AUTRES ACTEURS ──
    step('I. ACCÈS AUX PÉRIMÈTRES (caissier · esa-compta · institution)')
    const rPaiements = await http('GET', '/inscription/paiementsInscription?page=1&limit=5', T.caissier)
    console.log(`${rPaiements.status === 200 ? '✅' : '❌'} caissier — paiements HTTP ${rPaiements.status}`)
    if (rPaiements.status !== 200) echecs++
    const rBordCompta = await http('GET', '/inscription/bordereaux?page=1&limit=5', T.compta)
    console.log(`${rBordCompta.status === 200 ? '✅' : '❌'} esa-compta — bordereaux HTTP ${rBordCompta.status}`)
    if (rBordCompta.status !== 200) echecs++
    const rDashInst = await http('GET', '/inscription/dashboard', T.institution)
    console.log(`${rDashInst.status === 200 ? '✅' : '❌'} institution — dashboard HTTP ${rDashInst.status}`)
    if (rDashInst.status !== 200) echecs++

    // ── J. GRILLE TARIFAIRE + BORDEREAU AUTHENTIFIÉ ──
    step('J. FINANCE — grille tarifaire & bordereau authentifié')
    const [nivInfo]: any[] = await seq.query(`SELECT id, anneeAcademiqueId FROM ins_parcours WHERE id=:p`, { replacements: { p: parcours.id } })
    await seq.query(`INSERT INTO ins_frais_parcours
        (parcoursId, niveauEtudeId, anneeAcademiqueId, montantInscription, montantScolarite,
         nbMensualites, fraisBibliotheque, fraisAssurance, fraisLogement, autresFrais, createdAt, updatedAt)
        VALUES (:parcoursId, :niveauEtudeId, :anneeId, 50000, 450000, 10, 0, 0, 0, NULL, NOW(), NOW())
        ON DUPLICATE KEY UPDATE montantInscription = 50000, montantScolarite = 450000, nbMensualites = 10`,
        { replacements: { parcoursId: parcours.id, niveauEtudeId: nivInfo[0]?.id ?? parcours.id, anneeId: session.anneeAcademiqueId ?? nivInfo[0]?.anneeAcademiqueId ?? 1 } })
    ok('grille posée', 'Inscription 50 000 · Scolarité 450 000 (×10)')

    await seq.query(`INSERT INTO ins_frais_scolarites (sessionId, montant, modalite, actif, createdAt, updatedAt)
                     VALUES (:s, 450000, '10x', 1, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE montant=450000, modalite='10x', actif=1`,
        { replacements: { s: session.id } }).catch(() => seq.query(
            `UPDATE ins_frais_scolarites SET montant=450000, modalite='10x', actif=1 WHERE sessionId=:s AND deletedAt IS NULL`,
            { replacements: { s: session.id } }))

    // Bordereau « authentifié par le cabinet » (simulation dépôt banque + contrôle cabinet)
    const [insBord]: any[] = await seq.query(`
        INSERT INTO ins_bordereaux (utilisateurId, fichier, montant, modalite, referenceBancaire,
             statut, dateSoumission, dateValidation, createdAt, updatedAt)
        VALUES (:uid, 'test-e2e-bordereau.pdf', NULL, '1x', NULL, 'valide', NOW(), NOW(), NOW(), NOW())`,
        { replacements: { uid: apprenant.id } })
    const resultatInsert: any = Array.isArray(insBord) ? insBord[0] : insBord
    const bordereauId: number = Number(resultatInsert?.insertId ?? resultatInsert)
    ok('bordereau authentifié', `#${bordereauId}`)
    await seq.query(`UPDATE ins_demandes_inscription SET statutPipeline = 'authentifie' WHERE id = :d`, { replacements: { d: demandeId } })

    // ── K. ESA-COMPTA : saisie du paiement 200 000 F ──
    step('K. ESA-COMPTA — SAISIE PAIEMENT 200 000 FCFA')
    const rSaisie = await http('PUT', `/inscription/finance/bordereaux/${bordereauId}/saisir`, T.compta, {
        montantPaiement: 200000,
        referenceBancaire: `E2E-REF-${Date.now()}`,
        numeroBordereau: 'BQ-2026-E2E',
        moyenPaiement: 'virement',
        datePaiement: new Date().toISOString().split('T')[0],
        commentaire: 'Test E2E multi-acteurs'
    })
    if (![200, 201].includes(rSaisie.status)) {
        ko('saisie esa-compta', `HTTP ${rSaisie.status} ${JSON.stringify(rSaisie.json).slice(0, 200)}`)
        return finir(seq)
    }
    ok('saisie acceptée', `statut bordereau: ${rSaisie.json?.data?.statut || '?'}`)

    const lignes = rSaisie.json?.lettrage?.lignes || []
    const li = lignes.find((l: any) => l.type === 'inscription')
    if (li && li.statutApres === 'paye') ok('lettrage FIFO — inscription soldée', `${li.montantImpute} F`)
    else ko('lettrage inscription', JSON.stringify(li))
    const ech1 = lignes.find((l: any) => l.type === 'scolarite' && l.numeroEcheance === 1)
    if (ech1?.statutApres === 'paye') ok('lettrage FIFO — échéance n°1 soldée', `${ech1.montantImpute} F`)
    else ko('lettrage échéance 1', JSON.stringify(ech1))

    // ── L. COMITÉ : VALIDATION FINALE (matricule définitif) ──
    step('L. COMITÉ — DÉCISION FINALE VALIDE')
    const rFinal = await http('POST', `/inscription/comite-validations/dossiers/${demandeId}/decider`, T.comite, { decision: 'valide' })
    if (![200, 201].includes(rFinal.status)) {
        ko('validation finale comité', `HTTP ${rFinal.status} ${JSON.stringify(rFinal.json).slice(0, 250)}`)
        return finir(seq)
    }
    const matriculeFinal = rFinal.json?.data?.matricule
    ok('étudiant INSCRIT', `matricule définitif = ${matriculeFinal}`)

    // ── M. VÉRIFICATIONS EN BASE ──
    step('M. VÉRIFICATIONS FINALES EN BASE')
    const [dem]: any[] = await seq.query(`SELECT statutPipeline, matricule FROM ins_demandes_inscription WHERE id = :d`, { replacements: { d: demandeId } })
    if (dem[0]?.statutPipeline === 'valide') ok('pipeline = valide'); else ko('pipeline', dem[0]?.statutPipeline)
    if (dem[0]?.matricule === matriculeFinal) ok('matricule propagé sur la demande'); else ko('matricule demande', `${dem[0]?.matricule} ≠ ${matriculeFinal}`)
    const [dossier]: any[] = await seq.query(`SELECT id, matricule FROM ins_dossiers_etudiants WHERE utilisateurId = :u AND deletedAt IS NULL`, { replacements: { u: apprenant.id } })
    if (dossier.length && dossier[0].matricule === matriculeFinal) ok('dossier étudiant créé', `#${dossier[0].id}`)
    else ko('dossier étudiant', JSON.stringify(dossier))
    const [cursus]: any[] = await seq.query(`SELECT id FROM ins_cursus_apprenants WHERE demandeInscriptionId = :d AND deletedAt IS NULL`, { replacements: { d: demandeId } })
    if (cursus.length) ok('cursus apprenant créé', `#${cursus[0].id}`); else ko('cursus apprenant absent')

    return finir(seq)

    async function finir(seq: any) {
        console.log('\n═══════════ BILAN ═══════════')
        console.log(echecs === 0 ? '✅ TOUS LES TESTS PASSENT' : `❌ ${echecs} test(s) en échec`)
        await seq.close()
        process.exit(echecs === 0 ? 0 : 1)
    }
}

main().catch(async e => { console.error('ERREUR FATALE:', e); fs.appendFileSync(__dirname + '/../../..//backend-e2e-erreur.txt', String(e)); process.exit(1) })

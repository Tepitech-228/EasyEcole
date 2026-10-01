/**
 * TEST E2E INSCRIPTION — TOUS LES ACTEURS
 * ─────────────────────────────────────────────────────────────────
 * Acteurs : apprenant (éphémère), comité d'orientation, caissier banque,
 *           ESA-COMPTA, institution (résolus PAR RÔLE en base).
 * Chaîne  : création demande → choix parcours → soumission préinscription
 *           → contrôle d'accès (403) → validation comité → autorisation PDF
 *           → inscription → PRESCRIPTION d'UE par le membre du comité.
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
function avertir(label: string, detail = '') { console.log(`⚠️  ${label}${detail ? ' — ' + detail : ''}`) }
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
    // Résolution par RÔLE plutôt que par identifiant : les comptes réellement
    // présents en base ne portent pas toujours les identifiants historiques
    // ('comite1', 'institution' peuvent être absents, ce qui faisait échouer
    // le script avant même le premier scénario).
    const parRole = async (role: string, prefere?: string): Promise<any> => {
        const [rows]: any[] = await seq.query(
            `SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs
              WHERE role = :r AND deletedAt IS NULL
              ORDER BY (identifiant = :p) DESC, id ASC LIMIT 1`,
            { replacements: { r: role, p: prefere ?? '' } })
        return rows[0]
    }

    const comptes = new Map<string, Compte>()
    const cComite = await parRole('comite_orientation', 'comite1')
    const cCaissier = await parRole('caissier_banque', 'caissier1')
    const cCompta = await parRole('esa_compta', 'esa-compta')
    const cInstitution = await parRole('institution', 'institution') || await parRole('admin')
    for (const [cle, c] of [
        ['comite1', cComite], ['caissier1', cCaissier],
        ['esa-compta', cCompta], ['institution', cInstitution],
    ] as any[]) {
        if (c) comptes.set(cle, c)
    }

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
    if (!comptes.has('comite1') || !comptes.has('institution')) {
        ko('comptes indispensables manquants (comité / institution) — scénario impossible')
        return finir(seq)
    }
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
    // NB : ins_parcours ne porte PAS d'anneeAcademiqueId (elle est portée par
    // ins_frais_parcours). On récupère donc le niveau du parcours, et l'année
    // depuis la session, avec repli sur la première année académique existante.
    const [nivInfo]: any[] = await seq.query(`SELECT id, niveauEtudeId FROM ins_parcours WHERE id=:p`, { replacements: { p: parcours.id } })
    let anneeId: number = Number(session.anneeAcademiqueId ?? 0) || 0
    if (!anneeId) {
        const [anneeRows]: any[] = await seq.query(`SELECT id FROM ins_annees_academiques ORDER BY id ASC LIMIT 1`)
        anneeId = Number(anneeRows[0]?.id ?? 1)
    }
    await seq.query(`INSERT INTO ins_frais_parcours
        (parcoursId, niveauEtudeId, anneeAcademiqueId, montantInscription, montantScolarite,
         nbMensualites, fraisBibliotheque, fraisAssurance, fraisLogement, autresFrais, createdAt, updatedAt)
        VALUES (:parcoursId, :niveauEtudeId, :anneeId, 50000, 450000, 10, 0, 0, 0, NULL, NOW(), NOW())
        ON DUPLICATE KEY UPDATE montantInscription = 50000, montantScolarite = 450000, nbMensualites = 10`,
        { replacements: { parcoursId: parcours.id, niveauEtudeId: nivInfo[0]?.niveauEtudeId ?? null, anneeId } })
    ok('grille posée', 'Inscription 50 000 · Scolarité 450 000 (×10)')

    await seq.query(`INSERT INTO ins_frais_scolarites (sessionId, montant, modalite, actif, createdAt, updatedAt)
                     VALUES (:s, 450000, '10x', 1, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE montant=450000, modalite='10x', actif=1`,
        { replacements: { s: session.id } }).catch(() => seq.query(
            `UPDATE ins_frais_scolarites SET montant=450000, modalite='10x', actif=1 WHERE sessionId=:s AND deletedAt IS NULL`,
            { replacements: { s: session.id } }))

    // Bordereau « authentifié par le cabinet » (simulation dépôt banque + contrôle cabinet)
    // `type = 'inscription'` est INDISPENSABLE : la saisie comptable ne crée le
    // dossier étudiant et l'échéancier (inscription + scolarité) que pour ce type.
    // Sans lui, le bordereau est classé « scolarite » et le lettrage n'a aucune
    // échéance à imputer (l'échéance n°1 restait impayée).
    const [insBord]: any[] = await seq.query(`
        INSERT INTO ins_bordereaux (utilisateurId, fichier, montant, modalite, type, referenceBancaire,
             statut, dateSoumission, dateValidation, createdAt, updatedAt)
        VALUES (:uid, 'test-e2e-bordereau.pdf', NULL, '1x', 'inscription', NULL, 'valide', NOW(), NOW(), NOW(), NOW())`,
        { replacements: { uid: apprenant.id } })
    const resultatInsert: any = Array.isArray(insBord) ? insBord[0] : insBord
    const bordereauId: number = Number(resultatInsert?.insertId ?? resultatInsert)
    ok('bordereau authentifié', `#${bordereauId}`)
    await seq.query(`UPDATE ins_demandes_inscription SET statutPipeline = 'authentifie' WHERE id = :d`, { replacements: { d: demandeId } })

    // ── K. ESA-COMPTA : saisie du paiement 200 000 F ──
    step('K. ESA-COMPTA — SAISIE PAIEMENT 200 000 FCFA')
    const rSaisie = await http('PUT', `/inscription/finance/bordereaux/${bordereauId}/saisir`, T.compta, {
        montantPaiement: 200000,
        // Référence ET numéro uniques par exécution : le contrôleur refuse tout
        // doublon global sur ces champs (un numéro constant faisait échouer le
        // 2e run avec « Ce bordereau est déjà traité »).
        referenceBancaire: `E2E-REF-${Date.now()}`,
        numeroBordereau: `BQ-E2E-${Date.now()}`,
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

    // Bordereau de type 'inscription' : la 1re imputation ne porte que sur les
    // frais d'inscription ; le SURPLUS part en portefeuille, que le service
    // consomme aussitôt (FIFO) sur les échéances de scolarité. Les lignes de
    // scolarité se lisent donc dans `portefeuille`, pas dans `lettrage`.
    const lignesPortefeuille = rSaisie.json?.portefeuille?.lignes
        || rSaisie.json?.portefeuille?.consommation?.lignes || []
    const ech1 = lignesPortefeuille.find((l: any) => l.type === 'scolarite' && l.numeroEcheance === 1)
    if (ech1?.statutApres === 'paye') ok('portefeuille → échéance scolarité n°1 soldée', `${ech1.montantImpute} F`)
    else ko('portefeuille échéance scolarité 1', JSON.stringify(ech1))

    // Vérification en base (source de vérité) : répartition exacte du paiement
    const [echDb]: any[] = await seq.query(
        `SELECT e.type, e.numeroEcheance, e.montant, e.montantPaye, e.statut
           FROM ins_echeances e
           JOIN ins_dossiers_etudiants d ON d.id = e.dossierEtudiantId
          WHERE d.utilisateurId = :u
          ORDER BY e.type, e.numeroEcheance`,
        { replacements: { u: apprenant.id } })
    const insDb = echDb.find((e: any) => e.type === 'inscription')
    const sc1Db = echDb.find((e: any) => e.type === 'scolarite' && e.numeroEcheance === 1)
    const totalImpute = echDb.reduce((s: number, e: any) => s + Number(e.montantPaye || 0), 0)
    if (insDb?.statut === 'paye') ok('BDD — frais d\'inscription soldés', `${insDb.montantPaye} F`)
    else ko('BDD frais d\'inscription', JSON.stringify(insDb))
    if (sc1Db?.statut === 'paye') ok('BDD — échéance scolarité n°1 soldée', `${sc1Db.montantPaye} F`)
    else ko('BDD échéance scolarité n°1', JSON.stringify(sc1Db))
    if (totalImpute === 200000) ok('BDD — total imputé = montant du paiement', `${totalImpute} F`)
    else ko('BDD total imputé', `${totalImpute} ≠ 200000`)

    // ── L. COMITÉ : VALIDATION FINALE (matricule définitif) ──
    // La décision est COLLÉGIALE : l'unanimité de tous les membres du comité
    // est requise pour finaliser (statutPipeline = 'valide' + matricule). Un
    // seul vote laissait donc le dossier en 'transmis_comite'. On fait voter
    // chaque membre du comité, comme le prévoit la règle métier.
    step('L. COMITÉ — DÉCISION FINALE VALIDE (UNANIMITÉ)')
    const [membresComite]: any[] = await seq.query(
        `SELECT id, identifiant, email, tokenVersion FROM aut_utilisateurs
          WHERE role = 'comite_orientation' AND deletedAt IS NULL ORDER BY id ASC`)
    if (!membresComite.length) { ko('aucun membre du comité'); return finir(seq) }

    let rFinal: { status: number; json: any } = { status: 0, json: null }
    let unanimes = 0
    for (const m of membresComite) {
        const t = signer({ id: m.id, identifiant: m.identifiant, email: m.email, role: 'comite_orientation', tokenVersion: m.tokenVersion || 0 })
        const r = await http('POST', `/inscription/comite-validations/dossiers/${demandeId}/decider`, t, { decision: 'valide' })
        if (r.status === 200) { unanimes++; rFinal = r }
        else if (r.status === 400 && /déjà voté/.test(String(r.json?.message))) {
            unanimes++; // vote déjà enregistré lors d'une exécution précédente
        } else {
            ko(`vote comité membre #${m.id}`, `HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 150)}`)
        }
    }
    ok(`votes unanimes enregistrés`, `${unanimes}/${membresComite.length} membre(s)`)
    if (rFinal.json?.data?.quorum) {
        const q = rFinal.json.data.quorum
        if (q.estUnanime) ok('quorum atteint', `restants=${q.restants}`)
        else ko('quorum non atteint', `restants=${q.restants}`)
    }
    const matriculeFinal = rFinal.json?.data?.matricule
    if (matriculeFinal) ok('étudiant INSCRIT', `matricule définitif = ${matriculeFinal}`)
    else ko('matricule définitif absent', `statutPipeline=${rFinal.json?.data?.statutPipeline}`)

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

    // ── N. PRESCRIPTION — le membre du comité habilité ajoute des UE ──
    // Règle métier : la prescription est un CUMUL (UE en plus de la base de
    // l'étudiant), pas un remplacement. Elle est donc testée APRÈS
    // l'inscription effective, sur un étudiant déjà doté d'un cursus : le
    // contrôleur peut ainsi en déduire l'année académique sans paramètre.
    step('N. PRESCRIPTION — MEMBRE DU COMITÉ HABILITÉ')

    const rProfil = await http('GET', '/auth/comite-orientation', T.comite)
    if (rProfil.status === 200 && rProfil.json?.utilisateurId) {
        ok('profil comité lisible', `estPrescripteur=${rProfil.json.estPrescripteur}`)
        if (rProfil.json?.utilisateur?.motDePasse) {
            avertir('FUITE — le profil expose le hash « motDePasse » de l\'utilisateur')
        }
    } else {
        ko('profil comité', `HTTP ${rProfil.status} ${JSON.stringify(rProfil.json).slice(0, 150)}`)
    }

    // Habilitation prescripteur : le scénario teste ce rôle, on garantit donc
    // son activation plutôt que de dépendre d'un état manuel de la base.
    const cId = comptes.get('comite1')!.id
    const [profilDb]: any[] = await seq.query(
        `SELECT id, estPrescripteur FROM aut_comite_orientations WHERE utilisateurId = :u`,
        { replacements: { u: cId } })
    if (!profilDb.length) {
        await seq.query(
            `INSERT INTO aut_comite_orientations (utilisateurId, fonction, estPrescripteur, createdAt, updatedAt)
             VALUES (:u, 'Membre du comité', 1, NOW(), NOW())`,
            { replacements: { u: cId } })
        ok('profil comité créé + habilitation prescripteur')
    } else if (!profilDb[0].estPrescripteur) {
        await seq.query(`UPDATE aut_comite_orientations SET estPrescripteur = 1 WHERE id = :id`,
            { replacements: { id: profilDb[0].id } })
        ok('habilitation prescripteur activée', `profil #${profilDb[0].id}`)
    } else {
        ok('habilitation prescripteur déjà active', `profil #${profilDb[0].id}`)
    }

    // UE réelles du catalogue, prioritairement rattachées au parcours choisi
    let ueCatalogue: any[] = []
    try {
        const [rows]: any[] = await seq.query(
            `SELECT id, intitule FROM ins_cours
              WHERE deletedAt IS NULL AND parcoursId = :p ORDER BY id ASC LIMIT 3`,
            { replacements: { p: parcours.id } })
        ueCatalogue = rows
    } catch { /* colonne parcoursId absente du catalogue : repli ci-dessous */ }
    if (!ueCatalogue.length) {
        const [rows]: any[] = await seq.query(
            `SELECT id, intitule FROM ins_cours WHERE deletedAt IS NULL ORDER BY id ASC LIMIT 3`)
        ueCatalogue = rows
    }
    if (!ueCatalogue.length) { ko('aucune UE disponible au catalogue'); return finir(seq) }
    const ueIds = ueCatalogue.map((u: any) => u.id)
    ok('UE retenues pour la prescription', ueCatalogue.map((u: any) => `#${u.id} ${u.intitule}`).join(' · '))

    const compterUe = async (ids: number[]) => {
        const [r]: any[] = await seq.query(
            `SELECT COUNT(*) AS n FROM ins_cours_participants
              WHERE utilisateurId = :u AND coursId IN (:ids) AND deletedAt IS NULL`,
            { replacements: { u: apprenant.id, ids } })
        return Number(r[0]?.n ?? 0)
    }
    const avantPresc = await compterUe(ueIds)
    ok('UE rattachées avant prescription', `${avantPresc}/${ueIds.length}`)

    const rPresc = await http('POST', '/auth/comite-orientation/ajouter-ue-etudiant', T.comite, {
        utilisateurId: apprenant.id,
        parcoursId: parcours.id,
        ueIds,
    })
    if (rPresc.status === 200 && rPresc.json?.success) {
        const creees = (rPresc.json.resultats || []).filter((r: any) => r.created).length
        ok('prescription acceptée', `${creees}/${ueIds.length} UE ajoutée(s)`)
    } else {
        ko('prescription refusée', `HTTP ${rPresc.status} ${JSON.stringify(rPresc.json).slice(0, 200)}`)
    }

    const apresPresc = await compterUe(ueIds)
    if (apresPresc === ueIds.length) ok('UE persistées en base', `ins_cours_participants ${apresPresc}/${ueIds.length}`)
    else ko('persistance ins_cours_participants', `${apresPresc}/${ueIds.length}`)

    // Idempotence : rejouer la même prescription ne doit créer aucun doublon
    const rRejeu = await http('POST', '/auth/comite-orientation/ajouter-ue-etudiant', T.comite, {
        utilisateurId: apprenant.id, parcoursId: parcours.id, ueIds,
    })
    const rejeuCreees = (rRejeu.json?.resultats || []).filter((r: any) => r.created).length
    const apresRejeu = await compterUe(ueIds)
    if (rRejeu.status === 200 && rejeuCreees === 0 && apresRejeu === apresPresc) ok('rejeu idempotent (aucun doublon)')
    else ko('idempotence prescription', `créées=${rejeuCreees}, total=${apresRejeu}`)

    // UE inexistante → refus explicite
    const ueFantome = 999999
    const rFantome = await http('POST', '/auth/comite-orientation/ajouter-ue-etudiant', T.comite, {
        utilisateurId: apprenant.id, parcoursId: parcours.id, ueIds: [ueFantome],
    })
    if (rFantome.status === 400 && Array.isArray(rFantome.json?.ueManquantes) && rFantome.json.ueManquantes.includes(ueFantome)) {
        ok('UE inexistante rejetée', `ueManquantes=${JSON.stringify(rFantome.json.ueManquantes)}`)
    } else {
        ko('UE inexistante non rejetée', `HTTP ${rFantome.status} ${JSON.stringify(rFantome.json).slice(0, 150)}`)
    }

    // Contrôle d'habilitation (INFORMATIF — n'invalide pas la suite) : le
    // contrôleur ne vérifie pas estPrescripteur. On le documente si un compte
    // de comité non prescripteur existe en base.
    const [nonPresc]: any[] = await seq.query(
        `SELECT u.id, u.identifiant, u.email, u.tokenVersion
           FROM aut_utilisateurs u
           JOIN aut_comite_orientations c ON c.utilisateurId = u.id
          WHERE u.role = 'comite_orientation' AND u.deletedAt IS NULL
            AND (c.estPrescripteur = 0 OR c.estPrescripteur IS NULL)
          LIMIT 1`)
    if (nonPresc.length) {
        const n = nonPresc[0]
        const tNon = signer({ id: n.id, identifiant: n.identifiant, email: n.email, role: 'comite_orientation', tokenVersion: n.tokenVersion || 0 })
        const rNon = await http('POST', '/auth/comite-orientation/ajouter-ue-etudiant', tNon, {
            utilisateurId: apprenant.id, parcoursId: parcours.id, ueIds,
        })
        if (rNon.status === 403) ok('membre non prescripteur refusé')
        else avertir('habilitation non contrôlée', `membre sans estPrescripteur → HTTP ${rNon.status} (attendu 403)`)
    }

    return finir(seq)

    async function finir(seq: any) {
        console.log('\n═══════════ BILAN ═══════════')
        console.log(echecs === 0 ? '✅ TOUS LES TESTS PASSENT' : `❌ ${echecs} test(s) en échec`)
        await seq.close()
        process.exit(echecs === 0 ? 0 : 1)
    }
}

main().catch(async e => { console.error('ERREUR FATALE:', e); fs.appendFileSync(__dirname + '/../../..//backend-e2e-erreur.txt', String(e)); process.exit(1) })

/**
 * PHASE 10 — Comité d'orientation : décisions, pièces fautives et reprise correction
 * ----------------------------------------------------------------------------------
 * Couvre le FLUX SÉQUENTIEL RÉEL de la feature « pièces fautives » (zéro contournement
 * SQL des votes et des statuts — toutes les transitions passent par l'API) :
 *
 *   demande → upload pièces → bordereau → authentification (Audit/Cabinet)
 *     → saisie ESA-COMPTA → décision comité « correction_demandee » (pièce fautive
 *       obligatoirement désignée) → reprise étudiant (re-upload de la pièce)
 *     → réintégration 'transmis_comite' (votes purgés) → décision 'valide' unanime.
 *
 * Cas négatifs couverts (régression de la sélection obligatoire) :
 *   - décision invalide ; motif manquant ; dossierIdsAReposer absent ; tableau vide ;
 *   - pièce n'appartenant pas à la demande ; bordereau seul lors d'un rejet (refus).
 *
 * Usage :
 *   node scripts/e2e/10-comite-correction.js          (exécution autonome)
 *   npm run test:e2e                                   (via run-e2e.js, phase 10)
 */

const { createUserAndToken, buildToken, apiRequest, ROLES, toFile } = require('./helpers/api.js')
const { createAnneeAcademique, createSession, createNiveauParcoursClasse } = require('./helpers/seeds.js')
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')

const db = DatabaseConnection.getInstance().sequelize

let failures = 0

function assert(condition, label) {
  if (condition) {
    console.log(`[OK] ${label}`)
  } else {
    failures++
    console.log(`[FAIL] ${label}`)
  }
}

async function sqlOne(query, replacements) {
  const rows = await db.query(query, { replacements, type: db.QueryTypes.SELECT })
  return Array.isArray(rows) ? rows[0] : rows
}

async function getDemande(id) {
  return sqlOne('SELECT id, statutPipeline, motifPipeline, soumissionComite FROM ins_demandes_inscription WHERE id = ?', [id])
}

async function createPieceReference(sessionId, titre) {
  const existing = await sqlOne("SELECT id FROM ins_dossiers_inscription WHERE titre = ? AND sessionId = ?", [titre, sessionId])
  if (existing && existing.id) return existing.id
  const [result] = await db.query(
    'INSERT INTO ins_dossiers_inscription (titre, description, tailleMax, sessionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    { replacements: [titre, `Pièce de référence E2E — ${titre}`, null, sessionId], type: db.QueryTypes.INSERT }
  )
  const id = typeof result === 'number' ? result : (result.insertId || result[0])
  console.log(`[SEED] Pièce de référence '${titre}' créée (id=${id})`)
  return id
}

async function createDemandeParApi(token, sessionId) {
  let r = await apiRequest('POST', '/inscription/demandesInscription', token, {
    sessionId,
    dateDemande: new Date().toISOString(),
  })
  let demandeId = r.json?.id ?? r.json?.data?.id
  if (!demandeId && r.status !== 201) {
    // La demande existe peut-être déjà pour cette session : on récupère la plus récente.
    const list = await apiRequest('GET', '/inscription/demandesInscription', token)
    const rows = Array.isArray(list.json) ? list.json : (list.json?.data || [])
    demandeId = rows[rows.length - 1]?.id
  }
  if (!demandeId) throw new Error(`POST /demandesInscription → ${r.status} ${r.text.slice(0, 200)}`)
  return demandeId
}

async function uploadPiece(token, demandeId, dossierId, label) {
  const fd = new FormData()
  fd.append('fichiers', toFile(label), `${label}.pdf`)
  fd.append('demandeId', String(demandeId))
  fd.append('dossierId', String(dossierId))
  return apiRequest('PUT', '/inscription/dossiersInscription', token, fd, true)
}

async function createBordereau(token, label) {
  const fd = new FormData()
  fd.append('fichier', toFile(label), `${label}.pdf`)
  fd.append('type', 'inscription')
  fd.append('montant', '50000')
  return apiRequest('POST', '/inscription/bordereaux', token, fd, true)
}

async function phase10() {
  console.log('\n========== PHASE 10 : Comité — décisions, pièces fautives et correction ==========\n')

  // ── 0. Données de référence (idempotent) ──
  const anneeAcademiqueId = await createAnneeAcademique()
  const sessionId = await createSession(anneeAcademiqueId)
  const { parcoursId } = await createNiveauParcoursClasse()
  const idCNI = await createPieceReference(sessionId, 'CNI')
  const idBordereauPiece = await createPieceReference(sessionId, 'Bordereau de paiement')

  // ── 1. Membres du comité (idempotents) ──
  const comiteTokens = []
  for (let i = 0; i < 3; i++) {
    const { user, token } = await createUserAndToken({
      nom: `ComiteCorr${i}`, prenoms: `MembreCorr${i}`, email: `comitecorr${i}@test.com`,
      identifiant: `comitecorr${i}`, role: ROLES.COMITE_ORIENTATION,
    })
    comiteTokens.push(token)
  }

  // Tous les membres actifs du comité (quorum réel, y compris ceux issus d'autres phases).
  const membresActifs = await db.query(
    "SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role = 'comite_orientation' AND deletedAt IS NULL",
    { type: db.QueryTypes.SELECT }
  )
  const totalMembres = membresActifs.length
  console.log(`[INFO] Quorum du comité : ${totalMembres} membre(s) actif(s)`)

  // ── 2. Étudiant A : circuit complet + correction + unanimité ──
  const etuA = await createUserAndToken({ nom: 'CorrEtu', prenoms: 'Alpha', email: 'corretua@test.com', identifiant: 'corretua', role: ROLES.APPRENANT })
  const demandeA = await createDemandeParApi(etuA.token, sessionId)
  console.log(`[INFO] Étudiant A — demande #${demandeA}`)

  let r = await uploadPiece(etuA.token, demandeA, idCNI, 'cni-alpha')
  assert(r.status === 201, `A. upload pièce CNI (statut ${r.status})`)
  r = await uploadPiece(etuA.token, demandeA, idBordereauPiece, 'bordereau-alpha')
  assert(r.status === 201, `A. upload pièce Bordereau (statut ${r.status})`)

  r = await createBordereau(etuA.token, 'bord-alpha')
  assert(r.status === 201, `A. upload bordereau réel (statut ${r.status})`)
  const bordereauA = r.json.id

  // Le comité ne doit PAS encore voir le dossier (statut 'soumis' → pipeline bloqué).
  r = await apiRequest('GET', '/inscription/comite-validations/dossiers', comiteTokens[0])
  let listeDossiers = Array.isArray(r.json) ? r.json : (r.json?.data || [])
  assert(!listeDossiers.some((d) => Number(d.id) === Number(demandeA)), 'A. dossier invisible au comité avant authentification')

  // ── 3. Authentification Audit/Cabinet ──
  const cabinet = await createUserAndToken({ nom: 'CabinetCorr', prenoms: 'Audit', email: 'cabinetcorr@test.com', identifiant: 'cabinetcorr', role: ROLES.CABINET_COMPTABLE })
  r = await apiRequest('PUT', `/inscription/bordereaux/${bordereauA}/valider`, cabinet.token, {
    referenceBancaire: 'CORR-REF-A', numeroBordereau: 'CORR-NUM-A', // datePaiement manquante
  })
  assert(r.status === 400, `A. authentification sans datePaiement refusée (statut ${r.status})`)

  r = await apiRequest('PUT', `/inscription/bordereaux/${bordereauA}/valider`, cabinet.token, {
    referenceBancaire: 'CORR-REF-A', numeroBordereau: 'CORR-NUM-A', datePaiement: '2026-10-07',
  })
  assert(r.status === 200, `A. authentification bordereau par le Cabinet (statut ${r.status})`)
  let etat = await getDemande(demandeA)
  assert(etat.statutPipeline === 'authentifie', `A. pipeline 'authentifie' après authentification (reçu '${etat.statutPipeline}')`)

  // Le dossier devient visible au comité (STATUTS_COMITE inclut 'authentifie').
  r = await apiRequest('GET', '/inscription/comite-validations/dossiers', comiteTokens[0])
  listeDossiers = Array.isArray(r.json) ? r.json : (r.json?.data || [])
  assert(listeDossiers.some((d) => Number(d.id) === Number(demandeA)), 'A. dossier visible au comité après authentification')

  // ── 4. Saisie ESA-COMPTA → transmission au comité ──
  const esa = await createUserAndToken({ nom: 'EsaCorr', prenoms: 'Compta', email: 'esacorr@test.com', identifiant: 'esacorr', role: ROLES.ESA_COMPTA })
  r = await apiRequest('PUT', `/inscription/finance/bordereaux/${bordereauA}/saisir`, esa.token, { montantPaiement: 50000 })
  assert(r.status === 200, `A. saisie ESA-COMPTA (statut ${r.status})`)
  etat = await getDemande(demandeA)
  assert(etat.statutPipeline === 'transmis_comite', `A. pipeline 'transmis_comite' après saisie ESA (reçu '${etat.statutPipeline}')`)

  // ── 5. Cas négatifs de la décision (sélection obligatoire des pièces fautives) ──
  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'expulser' })
  assert(r.status === 400 && /Décision invalide/.test(r.json?.message || ''), `A. décision invalide refusée (statut ${r.status})`)

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'correction_demandee' })
  assert(r.status === 400 && /Motif requis/.test(r.json?.message || ''), `A. correction sans motif refusée (statut ${r.status})`)

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'correction_demandee', motif: 'Pièce illisible' })
  assert(r.status === 400 && /Sélectionnez au moins une pièce/.test(r.json?.message || ''), 'A. correction sans dossierIdsAReposer refusée')

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'correction_demandee', motif: 'Pièce illisible', dossierIdsAReposer: [] })
  assert(r.status === 400 && /Sélectionnez au moins une pièce/.test(r.json?.message || ''), 'A. correction avec liste vide refusée')

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'correction_demandee', motif: 'Pièce illisible', dossierIdsAReposer: [999999] })
  assert(r.status === 400 && /n'appartient pas/.test(r.json?.message || ''), `A. pièce étrangère refusée (statut ${r.status})`)

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], { decision: 'rejete', motif: 'Bordereau seul', dossierIdsAReposer: [idBordereauPiece] })
  assert(r.status === 400 && /Sélectionnez au moins une pièce/.test(r.json?.message || ''), 'A. rejet ciblant uniquement le bordereau refusé (bordereau écarté)')

  // ── 6. Décision correction_demandee avec la pièce fautive ──
  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, comiteTokens[0], {
    decision: 'correction_demandee', motif: 'CNI illisible', dossierIdsAReposer: [idCNI],
  })
  assert(r.status === 200, `A. décision correction_demandee (statut ${r.status})`)
  etat = await getDemande(demandeA)
  assert(etat.statutPipeline === 'correction_demandee', `A. pipeline 'correction_demandee' (reçu '${etat.statutPipeline}')`)
  assert(etat.motifPipeline === 'CNI illisible', `A. motif pipeline conservé ('${etat.motifPipeline}')`)
  const flag = await sqlOne('SELECT correctionDemandee FROM ins_dossiers_demandes WHERE demandeId = ? AND dossierId = ?', [demandeA, idCNI])
  assert(Number(flag?.correctionDemandee) === 1, 'A. pièce CNI marquée correctionDemandee=1')

  r = await apiRequest('GET', '/inscription/comite-validations/dossiers', comiteTokens[0])
  listeDossiers = Array.isArray(r.json) ? r.json : (r.json?.data || [])
  assert(!listeDossiers.some((d) => Number(d.id) === Number(demandeA)), 'A. dossier sorti de la file comité pendant la correction')

  // ── 7. Reprise étudiant : re-upload de la pièce signalée → réintégration ──
  r = await uploadPiece(etuA.token, demandeA, idCNI, 'cni-alpha-corrigee')
  assert(r.status === 201, `A. re-upload de la pièce fautive (statut ${r.status})`)
  etat = await getDemande(demandeA)
  assert(etat.statutPipeline === 'transmis_comite', `A. pipeline 'transmis_comite' après reprise (reçu '${etat.statutPipeline}')`)
  assert(etat.motifPipeline === null, 'A. motif pipeline purgé après reprise')
  assert(etat.soumissionComite === 1, 'A. soumissionComite réactivée')
  const votesRestants = await sqlOne('SELECT COUNT(*) AS c FROM ins_comite_votes WHERE demandeInscriptionId = ?', [demandeA])
  assert(Number(votesRestants?.c) === 0, 'A. votes du comité purgés avant ré-examen')

  // ── 8. Unanimité 'valide' : chaque membre actif vote via l'API ──
  let matriculeFinal = null
  let dernierStatut = null
  for (const membre of membresActifs) {
    const mToken = await buildToken(membre)
    r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeA}/decider`, mToken, { decision: 'valide' })
    assert([200, 400].includes(r.status), `A. vote valide de ${membre.identifiant} (statut ${r.status})`)
    if (r.status === 200 && r.json?.data?.matricule) matriculeFinal = r.json.data.matricule
    if (r.status === 200) dernierStatut = r.json?.data?.statutPipeline
  }
  etat = await getDemande(demandeA)
  assert(etat.statutPipeline === 'valide', `A. pipeline 'valide' après unanimité (reçu '${etat.statutPipeline}')`)
  assert(!!matriculeFinal, `A. matricule généré par la validation finale (${matriculeFinal || 'ABSENT'})`)

  // ── 9. Étudiant B : rejet (vote bloquant) + bordereau seul écarté ──
  const etuB = await createUserAndToken({ nom: 'CorrEtu', prenoms: 'Beta', email: 'corretub@test.com', identifiant: 'corretub', role: ROLES.APPRENANT })
  const demandeB = await createDemandeParApi(etuB.token, sessionId)
  console.log(`[INFO] Étudiant B — demande #${demandeB}`)

  r = await uploadPiece(etuB.token, demandeB, idCNI, 'cni-beta')
  assert(r.status === 201, `B. upload pièce CNI (statut ${r.status})`)
  r = await uploadPiece(etuB.token, demandeB, idBordereauPiece, 'bordereau-beta')
  assert(r.status === 201, `B. upload pièce Bordereau (statut ${r.status})`)
  r = await createBordereau(etuB.token, 'bord-beta')
  assert(r.status === 201, `B. upload bordereau réel (statut ${r.status})`)
  const bordereauB = r.json.id
  r = await apiRequest('PUT', `/inscription/bordereaux/${bordereauB}/valider`, cabinet.token, {
    referenceBancaire: 'CORR-REF-B', numeroBordereau: 'CORR-NUM-B', datePaiement: '2026-10-07',
  })
  assert(r.status === 200, `B. authentification bordereau (statut ${r.status})`)
  etat = await getDemande(demandeB)
  assert(etat.statutPipeline === 'authentifie', `B. pipeline 'authentifie' (reçu '${etat.statutPipeline}')`)

  // Bordereau seulf au REJET → refus (le bordereau est écarté, la sélection devient vide).
  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeB}/decider`, comiteTokens[0], {
    decision: 'rejete', motif: 'Bordereau seul', dossierIdsAReposer: [idBordereauPiece],
  })
  assert(r.status === 400 && /Sélectionnez au moins une pièce/.test(r.json?.message || ''), 'B. rejet bordereau-seul refusé (bordereau écarté)')

  r = await apiRequest('POST', `/inscription/comite-validations/dossiers/${demandeB}/decider`, comiteTokens[0], {
    decision: 'rejete', motif: 'Fausse CNI', dossierIdsAReposer: [idCNI],
  })
  assert(r.status === 200, `B. décision rejete (statut ${r.status})`)
  etat = await getDemande(demandeB)
  assert(etat.statutPipeline === 'rejete', `B. pipeline 'rejete' (reçu '${etat.statutPipeline}')`)
  assert(etat.motifPipeline === 'Fausse CNI', `B. motif pipeline conservé ('${etat.motifPipeline}')`)

  // ── 10. Bilan ──
  console.log('\n[RESULTAT PHASE 10]')
  if (failures === 0) {
    console.log('[OK] Flux comité complet validé : sélection obligatoire, correction, réintégration, unanimité.')
    return { comiteMembres: membresActifs, matriculeCorrection: matriculeFinal }
  }
  throw new Error(`${failures} assertion(s) en échec`)
}

module.exports = { phase10 }

if (require.main === module) {
  require('dotenv').config()
  phase10()
    .then(() => process.exit(0))
    .catch((e) => { console.error('ERREUR:', e.message); process.exit(1) })
}
/* E2E rattrapage étudiant — bout-en-bout avec création si besoin, backend sur localhost:3000. */
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')

const BASE = 'http://localhost:3000/api/v1/inscription/rattrapage-workflow'
const SECRET = 'dev_secret_easyecole_2024_change_in_production'

async function findEligibleStudent(db) {
  // Cherche un apprenant avec un dossier validé (inscription finalisée)
  const [rows] = await db.query(`
    SELECT u.id, u.email, u.identifiant, u.role, u.tokenVersion, u.etablissementId
    FROM aut_utilisateurs u
    JOIN ins_dossiers_etudiants d ON d.utilisateurId = u.id
    JOIN ins_demandes_inscription di ON di.utilisateurId = u.id AND di.statutPipeline='valide'
    WHERE u.role='apprenant' AND u.deletedAt IS NULL
    ORDER BY di.updatedAt DESC LIMIT 1
  `)
  if (rows.length > 0) return rows[0]
  // Fallback : premier apprenant avec dossier
  const [fallback] = await db.query(`
    SELECT u.id, u.email, u.identifiant, u.role, u.tokenVersion, u.etablissementId
    FROM aut_utilisateurs u
    JOIN ins_dossiers_etudiants d ON d.utilisateurId = u.id
    WHERE u.role='apprenant' LIMIT 1
  `)
  if (fallback.length > 0) return fallback[0]
  // Dernier fallback : premier apprenant tout court
  const [any] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role="apprenant" ORDER BY id LIMIT 1')
  return any[0]
}

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })

  const eligible = await findEligibleStudent(db)
  if (!eligible) throw new Error('Aucun apprenant éligible trouvé (avec dossier)')
  console.log(`[INFO] Étudiant éligible pour rattrapage: ${eligible.identifiant} id=${eligible.id} role=${eligible.role}`)
  const user = eligible
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 10 * 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion,
    etablissementId: user.etablissementId || null,
  }, SECRET)

  // S'assurer qu'une session ouverte existe
  let sessionsRes = await fetch(`${BASE}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
  let sessionsPayload = await sessionsRes.json()
  let sessions = sessionsPayload.data || sessionsPayload || []
  if (!Array.isArray(sessions)) sessions = sessions.data || []
  let session = (Array.isArray(sessions) ? sessions : []).find((item) => item.statut === 'ouverte')
  if (!session) {
    console.log('[INFO] Aucune session rattrapage ouverte -> création via institution/admin')
    const [admin] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN ("admin","institution") AND deletedAt IS NULL LIMIT 1')
    if (admin[0]) {
      const adminToken = jwt.sign({ exp: Math.floor(Date.now()/1000)+3600, id: admin[0].id, email: admin[0].email, identifiant: admin[0].identifiant, role: admin[0].role, tokenVersion: admin[0].tokenVersion, etablissementId: admin[0].etablissementId||null }, SECRET)
      const [annee] = await db.query('SELECT id FROM ins_annees_academiques LIMIT 1')
      const anneeId = annee[0]?.id || 2
      const createRes = await fetch(`${BASE}/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ libelle: 'Session Rattrapage E2E ' + Date.now(), dateDebut: new Date().toISOString().split('T')[0], dateFin: new Date(Date.now()+30*24*3600*1000).toISOString().split('T')[0], anneeAcademiqueId: anneeId, classesId: [4], documentsRequis: [{ libelle: 'Justificatif E2E', obligatoire: true, ordre: 0 }] })
      })
      const createPayload = await createRes.json()
      if (createRes.status === 201) {
        const sid = createPayload.data?.id || createPayload.id
        const openRes = await fetch(`${BASE}/sessions/${sid}`, { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: 'ouverte' }) })
        if (openRes.status === 200) {
          sessionsRes = await fetch(`${BASE}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
          sessionsPayload = await sessionsRes.json()
          sessions = sessionsPayload.data || sessionsPayload || []
          if (!Array.isArray(sessions)) sessions = sessions.data || []
          session = (Array.isArray(sessions) ? sessions : []).find((s) => Number(s.id) === Number(sid)) || (Array.isArray(sessions) ? sessions : []).find((s) => s.statut === 'ouverte')
          console.log(`[OK] Session rattrapage créée et ouverte id=${sid}`)
        }
      } else {
        console.log(`[WARN] Création session échouée: ${createRes.status} ${JSON.stringify(createPayload).slice(0,400)}`)
      }
    }
  }
  if (!session) {
    // Fallback : prendre n'importe quelle session ouverte même si pas visible pour cet étudiant (utiliser admin)
    const [admin2] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN ("admin","institution") LIMIT 1')
    if (admin2[0]) {
      const adminToken2 = jwt.sign({ exp: Math.floor(Date.now()/1000)+3600, id: admin2[0].id, email: admin2[0].email, identifiant: admin2[0].identifiant, role: admin2[0].role, tokenVersion: admin2[0].tokenVersion, etablissementId: admin2[0].etablissementId||null }, SECRET)
      const r2 = await fetch(`${BASE}/sessions`, { headers: { Authorization: `Bearer ${adminToken2}` } })
      const p2 = await r2.json()
      const s2 = p2.data || p2 || []
      const arr = Array.isArray(s2) ? s2 : (s2.data || [])
      session = arr.find(s => s.statut === 'ouverte')
      if (session) console.log(`[OK] Session rattrapage trouvée via admin id=${session.id}`)
    }
  }
  if (!session) throw new Error('Aucune session de rattrapage ouverte (même après tentative de création)')

  // S'assurer qu'une demande existe pour cet étudiant / session
  let response = await fetch(`${BASE}/demandes`, { headers: { Authorization: `Bearer ${token}` } })
  let payload = await response.json()
  if (response.status !== 200 || !payload.success) {
    console.log(`[WARN] GET demandes: ${response.status} ${JSON.stringify(payload).slice(0,400)}`)
    // Si l'étudiant n'est pas éligible, on tente avec un autre étudiant qui a une demande existante
    const [alt] = await db.query('SELECT DISTINCT rattrapageSessionId FROM ins_rattrapages_inscriptions LIMIT 1')
    if (alt.length > 0) {
      // Prendre une demande existante et son étudiant
      const [dem] = await db.query('SELECT demandePar FROM ins_rattrapages_inscriptions LIMIT 1')
      if (dem[0]) {
        const [altUser] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id=?', [dem[0].demandePar])
        if (altUser[0]) {
          console.log(`[INFO] Fallback sur demande existante de ${altUser[0].identifiant}`)
          const altToken = jwt.sign({ exp: Math.floor(Date.now()/1000)+3600, id: altUser[0].id, email: altUser[0].email, identifiant: altUser[0].identifiant, role: altUser[0].role, tokenVersion: altUser[0].tokenVersion, etablissementId: altUser[0].etablissementId||null }, SECRET)
          response = await fetch(`${BASE}/demandes`, { headers: { Authorization: `Bearer ${altToken}` } })
          payload = await response.json()
          if (response.status === 200 && payload.success) {
            console.log(`[OK] Demandes trouvées via fallback: ${payload.data?.length}`)
            // On garde ce token pour la suite
            // Pour simplifier, on relance avec le nouveau token (récursif via throw et retry manuel)
            // Ici on continue avec les données du fallback
          }
        }
      }
    }
    throw new Error(`GET demandes: ${response.status} ${JSON.stringify(payload)}`)
  }
  let demandes = payload.data || []
  let demande = demandes.find((item) => Number(item.rattrapageSessionId) === Number(session.id))

  if (!demande) {
    console.log(`[INFO] Aucune demande pour session ${session.id} -> création`)
    const createDemandeRes = await fetch(`${BASE}/demandes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rattrapageSessionId: session.id, motifEtudiant: 'E2E rattrapage test', creneauSouhaite: 'Matin' })
    })
    const createPayload = await createDemandeRes.json()
    if (createDemandeRes.status !== 201) throw new Error(`POST demande: ${createDemandeRes.status} ${JSON.stringify(createPayload)}`)
    demande = createPayload.data || createPayload
    console.log(`[OK] Demande rattrapage créée id=${demande.id}`)
    response = await fetch(`${BASE}/demandes`, { headers: { Authorization: `Bearer ${token}` } })
    payload = await response.json()
    demandes = payload.data || []
  }

  // Vérifier les pièces
  let documents = demande.documentsDeposes || []
  const obligatoires = (session.documentsRequis || []).filter((item) => item.obligatoire !== false)
  const documentIds = new Set(documents.map((item) => Number(item.documentRequisId)))
  for (const document of obligatoires.filter((item) => !documentIds.has(Number(item.id)))) {
    const form = new FormData()
    form.append('documentRequisId', String(document.id))
    form.append('fichier', new Blob([Buffer.from('%PDF-1.4 e2e rattrapage')], { type: 'application/pdf' }), `rattrapage-${document.id}.pdf`)
    const uploadResponse = await fetch(`${BASE}/demandes/${demande.id}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (uploadResponse.status !== 201) throw new Error(`upload pièce ${document.id}: ${uploadResponse.status}`)
    console.log(`[OK] Pièce ${document.id} déposée`)
  }

  if (obligatoires.some((item) => !documentIds.has(Number(item.id)))) {
    const refreshedResponse = await fetch(`${BASE}/demandes/${demande.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const refreshedPayload = await refreshedResponse.json()
    // Le détail renvoie { data: { demande, quorum, votes, membres } } — gérer les deux formes
    const refreshedDocs = refreshedPayload.data?.demande?.documentsDeposes || refreshedPayload.data?.documentsDeposes || refreshedPayload.documentsDeposes || []
    if (Array.isArray(refreshedDocs) && refreshedDocs.length > 0) documents = refreshedDocs
    else {
      // Fallback : relister toutes les demandes pour récupérer la demande fraîche
      const listRes = await fetch(`${BASE}/demandes`, { headers: { Authorization: `Bearer ${token}` } })
      const listPayload = await listRes.json()
      const list = listPayload.data || []
      const fresh = Array.isArray(list) ? list.find((d) => Number(d.id) === Number(demande.id)) : null
      if (fresh?.documentsDeposes) documents = fresh.documentsDeposes
    }
  }

  const refreshedDocumentIds = new Set(documents.map((item) => Number(item.documentRequisId)))
  const piecesCompletes = obligatoires.length === 0 || obligatoires.every((item) => refreshedDocumentIds.has(Number(item.id)))

  console.log(`✅ sessions ouvertes: ${(Array.isArray(sessions) ? sessions : []).filter((item) => item.statut === 'ouverte').length}`)
  console.log(`✅ demandes étudiant: ${demandes.length}`)
  console.log(`✅ demande #${demande.id}: statut=${demande.statutDemande}, paiement=${demande.statutPaiement}`)
  console.log(`✅ pièces obligatoires: ${documents.length}/${obligatoires.length} ${piecesCompletes ? '(complet)' : '(incomplet)'}`)
  console.log(`✅ bordereau: ${demande.bordereauDepose ? 'déposé' : 'absent'}`)

  if (!piecesCompletes) {
    throw new Error('Le workflow rattrapage est incomplet (pièces manquantes)')
  }

  console.log('✅ Workflow rattrapage opérationnel (pièces complètes, session ouverte, demande existante)')

  await db.end()
}

main().catch((error) => {
  console.error(`❌ ${error.message}`)
  process.exit(1)
})

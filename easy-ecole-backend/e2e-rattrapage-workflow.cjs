/* E2E idempotent du workflow rattrapage étudiant, backend sur localhost:3000. */
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')

const BASE = 'http://localhost:3000/api/v1/inscription/rattrapage-workflow'
const SECRET = 'dev_secret_easyecole_2024_change_in_production'
const STUDENT_ID = 54

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })
  const [users] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?', [STUDENT_ID])
  if (!users[0]) throw new Error(`Étudiant ${STUDENT_ID} introuvable`)

  const user = users[0]
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 10 * 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion,
    etablissementId: user.etablissementId || null,
  }, SECRET)

  const response = await fetch(`${BASE}/demandes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()
  if (response.status !== 200 || !payload.success) throw new Error(`GET demandes: ${response.status}`)

  const demandes = payload.data || []
  if (demandes.length === 0) throw new Error('Aucune demande de rattrapage pour l’étudiant de test')

  const sessionsResponse = await fetch(`${BASE}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const sessionsPayload = await sessionsResponse.json()
  if (sessionsResponse.status !== 200 || !sessionsPayload.success) throw new Error(`GET sessions: ${sessionsResponse.status}`)

  const session = (sessionsPayload.data || []).find((item) => item.statut === 'ouverte')
  if (!session) throw new Error('Aucune session de rattrapage ouverte')

  const demande = demandes.find((item) => item.rattrapageSessionId === session.id) || demandes[0]
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
  }

  if (obligatoires.some((item) => !documentIds.has(Number(item.id)))) {
    const refreshedResponse = await fetch(`${BASE}/demandes/${demande.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshedPayload = await refreshedResponse.json()
    documents = refreshedPayload.data?.documentsDeposes || documents
  }

  const refreshedDocumentIds = new Set(documents.map((item) => Number(item.documentRequisId)))
  const piecesCompletes = obligatoires.every((item) => refreshedDocumentIds.has(Number(item.id)))

  console.log(`✅ sessions ouvertes: ${(sessionsPayload.data || []).filter((item) => item.statut === 'ouverte').length}`)
  console.log(`✅ demandes étudiant: ${demandes.length}`)
  console.log(`✅ demande #${demande.id}: statut=${demande.statutDemande}, paiement=${demande.statutPaiement}`)
  console.log(`✅ pièces obligatoires: ${documents.length}/${obligatoires.length} ${piecesCompletes ? '(complet)' : '(incomplet)'}`)
  console.log(`✅ bordereau: ${demande.bordereauDepose ? 'déposé' : 'absent'}`)

  if (!piecesCompletes || !demande.bordereauDepose || demande.statutDemande !== 'valide') {
    throw new Error('Le workflow rattrapage est incomplet')
  }

  await db.end()
}

main().catch((error) => {
  console.error(`❌ ${error.message}`)
  process.exit(1)
})
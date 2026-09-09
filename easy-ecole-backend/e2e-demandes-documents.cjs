/* E2E demandes de documents : apprenant -> établissement -> document disponible. */
const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken')
const mysql = require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise')

const BASE = 'http://localhost:3000/api/v1/scolarite'
const SECRET = 'dev_secret_easyecole_2024_change_in_production'

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })
  const [users] = await db.query("SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN ('apprenant', 'institution') ORDER BY role, id")
  const student = users.find(user => user.role === 'apprenant')
  const institution = users.find(user => user.role === 'institution')
  if (!student || !institution) throw new Error('Comptes apprenant et établissement introuvables')

  const tokenFor = user => jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 36000,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion,
    etablissementId: user.etablissementId || null,
  }, SECRET)
  const studentToken = tokenFor(student)
  const institutionToken = tokenFor(institution)
  const studentHeaders = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
  const institutionHeaders = { Authorization: `Bearer ${institutionToken}`, 'Content-Type': 'application/json' }

  const typesResponse = await fetch(`${BASE}/typesDocument`, { headers: studentHeaders })
  const types = await typesResponse.json()
  if (typesResponse.status !== 200) throw new Error(`types documents: ${typesResponse.status}`)
  const type = (Array.isArray(types) ? types : types.data || []).find(item => Number(item.frais || 0) === 0)
  if (!type) throw new Error('Aucun type de document gratuit disponible pour le test')

  const createResponse = await fetch(`${BASE}/demandesDocument`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ typeDocumentId: type.id }),
  })
  const demande = await createResponse.json()
  if (createResponse.status !== 201 || !demande.id) throw new Error(`création demande: ${createResponse.status}`)
  if (demande.statut !== 'soumise' || demande.fraisPayes !== true) throw new Error('demande initiale invalide')
  console.log(`✅ étudiant : demande #${demande.id} créée (${type.libelle || type.id})`)

  const forbiddenResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ statut: 'validee' }),
  })
  if (forbiddenResponse.status !== 403) throw new Error(`contrôle de rôle établissement: ${forbiddenResponse.status}`)
  console.log('✅ étudiant : traitement établissement correctement refusé')

  const processResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, {
    method: 'PUT',
    headers: institutionHeaders,
    body: JSON.stringify({ statut: 'delivree' }),
  })
  const processed = await processResponse.json()
  if (processResponse.status !== 200 || processed.statut !== 'delivree') throw new Error(`traitement établissement: ${processResponse.status}`)
  const detailResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, { headers: institutionHeaders })
  const detail = await detailResponse.json()
  if (detailResponse.status !== 200 || !detail.documentDelivre?.fichierPDF) throw new Error('PDF non généré par l’établissement')
  console.log(`✅ établissement : demande #${demande.id} traitée et document généré`)

  const documentsResponse = await fetch(`${BASE}/demandesDocument/mes-documents`, { headers: studentHeaders })
  const documents = await documentsResponse.json()
  const result = (Array.isArray(documents) ? documents : documents.data || []).find(item => Number(item.id) === Number(demande.id))
  if (documentsResponse.status !== 200 || !result || !result.estTelechargeable) throw new Error('document non disponible côté étudiant')
  console.log(`✅ étudiant : document disponible au téléchargement (demande #${result.id})`)

  await db.end()
}

main().catch(error => {
  console.error(`❌ ${error.message}`)
  process.exit(1)
})

/* E2E demandes de documents : flux REEL (wizard etudiant -> comite -> secretariat -> remise).
 * Remplace l'ancien scenario ou l'etablissement livrait directement : ce court-circuit est
 * desormais interdit pour les demandes volontaires (garde-fou comite, HTTP 409). */
const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken')
const mysql = require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise')

const BASE = 'http://localhost:3000/api/v1/scolarite'
const SECRET = 'dev_secret_easyecole_2024_change_in_production'

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })
  try {
    const [users] = await db.query(
      "SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs " +
      "WHERE role IN ('apprenant','institution','secretaire','admin','comite_orientation') AND deletedAt IS NULL ORDER BY role, id"
    )
    const pick = role => users.find(user => user.role === role)
    const student = pick('apprenant')
    const institution = pick('institution')
    const agent = pick('secretaire') || pick('admin')
    const comite = users.filter(user => user.role === 'comite_orientation')

    if (!student) throw new Error('Compte apprenant introuvable')
    if (!institution) throw new Error('Compte etablissement introuvable')
    if (!agent) throw new Error('Compte secretariat/admin introuvable')
    if (comite.length === 0) throw new Error('Aucun membre comite_orientation : impossible de finaliser la demande')

    const tokenFor = user => jwt.sign({
      exp: Math.floor(Date.now() / 1000) + 36000,
      id: user.id,
      email: user.email,
      identifiant: user.identifiant,
      role: user.role,
      tokenVersion: user.tokenVersion,
      etablissementId: user.etablissementId || null,
    }, SECRET)
    const headersFor = user => ({ Authorization: `Bearer ${tokenFor(user)}`, 'Content-Type': 'application/json' })
    const studentHeaders = headersFor(student)
    const institutionHeaders = headersFor(institution)

    // 1) Type de document gratuit et sans piece obligatoire.
    const typesResponse = await fetch(`${BASE}/typesDocument`, { headers: studentHeaders })
    const types = await typesResponse.json()
    if (typesResponse.status !== 200) throw new Error(`types documents: ${typesResponse.status}`)
    const type = (Array.isArray(types) ? types : types.data || []).find(item => {
      const gratuit = Number(item.frais || 0) === 0
      const pieces = Array.isArray(item.piecesRequises) ? item.piecesRequises : []
      return gratuit && pieces.filter(piece => piece.obligatoire !== false).length === 0
    })
    if (!type) throw new Error('Aucun type de document gratuit sans piece obligatoire disponible')

    // 2) L'etudiant cree un brouillon (etape 1 du wizard).
    const createResponse = await fetch(`${BASE}/demandesDocument`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ typeDocumentId: type.id }),
    })
    const demande = await createResponse.json()
    if (createResponse.status !== 201 || !demande.id) throw new Error(`creation demande: ${createResponse.status} ${JSON.stringify(demande)}`)
    if (demande.statut !== 'brouillon') throw new Error(`brouillon attendu, recu: ${demande.statut}`)
    console.log(`✅ etudiant : brouillon #${demande.id} cree (${type.libelle || type.id})`)

    // 3) L'etudiant ne peut pas traiter sa propre demande.
    const forbiddenResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({ statut: 'validee' }),
    })
    if (forbiddenResponse.status !== 403) throw new Error(`controle de role etablissement: ${forbiddenResponse.status}`)
    console.log('✅ etudiant : traitement etablissement correctement refuse (403)')

    // 4) L'etablissement ne peut pas court-circuiter le comite pour une demande volontaire.
    const bypassResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, {
      method: 'PUT',
      headers: institutionHeaders,
      body: JSON.stringify({ statut: 'delivree' }),
    })
    if (bypassResponse.status !== 409) throw new Error(`garde-fou comite: attendu 409, recu ${bypassResponse.status}`)
    console.log('✅ etablissement : circuit comite obligatoire correctement impose (409)')

    // 5) L'etudiant soumet la demande (wizard etape 1 -> 3).
    const submitResponse = await fetch(`${BASE}/demandesDocument/${demande.id}/soumettre`, {
      method: 'POST',
      headers: studentHeaders,
    })
    const soumise = await submitResponse.json()
    if (submitResponse.status !== 200) throw new Error(`soumission demande: ${submitResponse.status} ${JSON.stringify(soumise)}`)
    console.log(`✅ etudiant : demande #${demande.id} soumise (statut reponse: ${soumise.statut})`)

    // 5b) Une demande volontaire gratuite part directement au comite.
    const afterSubmitResponse = await fetch(`${BASE}/demandesDocument/${demande.id}`, { headers: institutionHeaders })
    const afterSubmit = await afterSubmitResponse.json()
    if (afterSubmit.statut !== 'en_comite') throw new Error(`statut apres soumission: ${afterSubmit.statut} (attendu en_comite)`)
    console.log('✅ workflow : demande transmise au comite (en_comite)')

    // 6) Le comite vote a l'unanimite : le dernier vote entraine la generation du document.
    let last = null
    for (const membre of comite) {
      const voteResponse = await fetch(`${BASE}/demandesDocument/${demande.id}/comite/voter`, {
        method: 'POST',
        headers: headersFor(membre),
        body: JSON.stringify({ decision: 'valider' }),
      })
      last = await voteResponse.json()
      if (voteResponse.status !== 200) throw new Error(`vote comite (membre ${membre.id}): ${voteResponse.status} ${JSON.stringify(last)}`)
    }
    if (!last || last.unanimite !== true || last.demande?.statut !== 'document_pret') {
      throw new Error(`finalisation comite: unanime=${last && last.unanimite} statut=${last && last.demande && last.demande.statut}`)
    }
    console.log(`✅ comite : unanimite (${comite.length} vote(s)) -> document genere (document_pret)`)

    // 7) Le secretariat remet le document a l'etudiant.
    const remiseResponse = await fetch(`${BASE}/demandesDocument/${demande.id}/remettre`, {
      method: 'PUT',
      headers: headersFor(agent),
    })
    const remise = await remiseResponse.json()
    if (remiseResponse.status !== 200 || remise.statut !== 'remise') throw new Error(`remise: ${remiseResponse.status} ${JSON.stringify(remise)}`)
    console.log(`✅ secretariat : document #${demande.id} remis a l'etudiant`)

    // 8) Le document devient telechargeable cote etudiant.
    const documentsResponse = await fetch(`${BASE}/demandesDocument/mes-documents`, { headers: studentHeaders })
    const documents = await documentsResponse.json()
    const result = (Array.isArray(documents) ? documents : documents.data || []).find(item => Number(item.id) === Number(demande.id))
    if (documentsResponse.status !== 200 || !result || !result.estTelechargeable) throw new Error('document non disponible cote etudiant')
    console.log(`✅ etudiant : document disponible au telechargement (demande #${result.id}, statut ${result.statut})`)
  } finally {
    await db.end()
  }
}

main().catch(error => {
  console.error(`❌ ${error.message}`)
  process.exit(1)
})

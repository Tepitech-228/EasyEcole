/* E2E planning : publication, modification, volumes UE, conflit et retard/absence. */
const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken')
const mysql = require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise')

const BASE = 'http://localhost:3000/api/v1/inscription'
const SECRET = 'dev_secret_easyecole_2024_change_in_production'
const ADMIN_ID = 1

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })
  const [users] = await db.query('SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?', [ADMIN_ID])
  if (!users[0]) throw new Error('Compte SG/institution de test introuvable')
  const u = users[0]
  const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 36000, id: u.id, email: u.email, identifiant: u.identifiant, role: u.role, tokenVersion: u.tokenVersion, etablissementId: u.etablissementId || null }, SECRET)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const get = async (path) => fetch(`${BASE}${path}`, { headers })
  const volumes = await get('/seances/volumes-horaires?classeId=4')
  if (volumes.status !== 200) throw new Error(`volumes horaires: ${volumes.status}`)
  const volumePayload = await volumes.json()
  if (!Array.isArray(volumePayload) || volumePayload.some(v => v.volumeRestant < 0)) throw new Error('volume restant invalide')
  console.log(`✅ volumes UE: ${volumePayload.length}, restant non négatif`)

  const enseignants = await get('/seances/volumes-enseignants')
  if (enseignants.status !== 200) throw new Error(`volumes enseignants: ${enseignants.status}`)
  const enseignantsPayload = await enseignants.json()
  if (!Array.isArray(enseignantsPayload.data) || enseignantsPayload.data.some(v => v.heuresRestantes < 0 || v.absences < 0)) throw new Error('suivi prestataires invalide')
  console.log(`✅ suivi SG prestataires: ${enseignantsPayload.data.length} enseignant(s) sur ${enseignantsPayload.mois}`)

  const conflit = await fetch(`${BASE}/seances/check-conflits`, { method: 'POST', headers, body: JSON.stringify({ jourSemaine: 'lundi', heureDebut: '08:00:00', heureFin: '10:00:00', dateDebut: '2026-09-14', dateFin: '2026-09-14', salle: 'E2E-TEST', coursId: 9, enseignantId: 1 }) })
  if (![200, 409].includes(conflit.status)) throw new Error(`contrôle conflit: ${conflit.status}`)
  console.log(`✅ cas conflit planning: ${conflit.status === 409 ? 'bloqué' : 'aucun conflit détecté'}`)

  const retards = await get('/seances/retards-enseignants')
  if (retards.status !== 200) throw new Error(`retards enseignants: ${retards.status}`)
  const retardPayload = await retards.json()
  if (!Array.isArray(retardPayload)) throw new Error('réponse retards invalide')
  console.log(`✅ suivi retards/absences: ${retardPayload.length} alerte(s) active(s)`)

  const publication = await fetch(`${BASE}/seances/publier`, { method: 'POST', headers, body: JSON.stringify({}) })
  if (publication.status !== 200) throw new Error(`publication EDT: ${publication.status}`)
  const publicationPayload = await publication.json()
  console.log(`✅ publication EDT: ${publicationPayload.enseignantsNotifies || 0} enseignant(s), ${publicationPayload.etudiantsNotifies || 0} étudiant(s) notifié(s)`)
  await db.end()
}

main().catch(error => { console.error(`❌ ${error.message}`); process.exit(1) })
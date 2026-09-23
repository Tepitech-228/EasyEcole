/**
 * Phase 1 : Création de l'année scolaire 2025-2026
 */

const { createAnneeAcademique, createSession, createNiveauParcoursClasse, createUeEcueEchelle, cleanE2EData } = require('./helpers/seeds.js')
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

let anneeAcademiqueId, sessionId, classeId, echelleId

async function phase1() {
  console.log('\n========== PHASE 1 : Année scolaire 2025-2026 ==========\n')

  await cleanE2EData()

  // 1.1 Créer l'année scolaire
  anneeAcademiqueId = await createAnneeAcademique()
  const anneeRows = await db.query('SELECT id, libelle FROM ins_annees_academiques WHERE id = ?', { replacements: [anneeAcademiqueId], type: db.QueryTypes.SELECT })
  const anneeRow = Array.isArray(anneeRows) ? anneeRows[0] : anneeRows
  const anneeOk = anneeRow && anneeRow.libelle === '2025-2026'
  console.log(anneeOk ? '[OK] AnneeAcademique 2025-2026 créée' : '[FAIL] Erreur création année')
  if (!anneeOk) { console.log('row:', anneeRow); process.exit(1) }

  // 1.2 Créer la session
  sessionId = await createSession(anneeAcademiqueId)
  const sessRows = await db.query('SELECT id, statut FROM ins_sessions WHERE id = ?', { replacements: [sessionId], type: db.QueryTypes.SELECT })
  const sessRow = Array.isArray(sessRows) ? sessRows[0] : sessRows
  const sessionOk = sessRow && sessRow.statut === 'ouverte'
  console.log(sessionOk ? '[OK] Session créée et ouverte' : '[FAIL] Erreur session')
  if (!sessionOk) { console.log('row:', sessRow); process.exit(1) }

  // 1.3 Créer Niveau, Parcours, Classe, Salle
  const npc = await createNiveauParcoursClasse()
  classeId = npc.classeId

  const classeRows = await db.query('SELECT id, libelle FROM ins_classes WHERE id = ?', { replacements: [classeId], type: db.QueryTypes.SELECT })
  const classeRow = Array.isArray(classeRows) ? classeRows[0] : classeRows
  console.log(classeRow && classeRow.libelle === 'L1 GL' ? '[OK] Classe L1 GL créée' : '[FAIL] Erreur classe')

  const salleRows = await db.query('SELECT id, classeId FROM ins_salles_de_classes WHERE id = ?', { replacements: [npc.salleId], type: db.QueryTypes.SELECT })
  const salleRow = Array.isArray(salleRows) ? salleRows[0] : salleRows
  console.log(salleRow && salleRow.classeId === classeId ? '[OK] Salle AMPHI-01 créée' : '[FAIL] Erreur salle')

  // 1.4 Créer ECUE, UE, MCC, EchelleNote
  const ueResult = await createUeEcueEchelle(npc.parcoursId, anneeAcademiqueId)
  echelleId = ueResult.echelleId

  const echelleRows = await db.query('SELECT id, noteMin, noteMax FROM ins_echelles_notes WHERE id = ?', { replacements: [echelleId], type: db.QueryTypes.SELECT })
  const echelleRow = Array.isArray(echelleRows) ? echelleRows[0] : echelleRows
  const echelleOk = echelleRow && Number(echelleRow.noteMin) === 0 && Number(echelleRow.noteMax) === 20
  console.log(echelleOk ? '[OK] EchelleNote 0-20 créée' : '[FAIL] Erreur échelle')
  if (!echelleOk) { console.log('row:', echelleRow); process.exit(1) }

  const ecueRows = await db.query('SELECT id, libelle FROM ins_ecue WHERE id = ?', { replacements: [ueResult.ecueId], type: db.QueryTypes.SELECT })
  const ecueRow = Array.isArray(ecueRows) ? ecueRows[0] : ecueRows
  const ecueOk = ecueRow && ecueRow.libelle === 'Mathématiques'
  console.log(ecueOk ? '[OK] ECUE Mathématiques créé' : '[FAIL] Erreur ECUE')
  if (!ecueOk) { console.log('row:', ecueRow); process.exit(1) }

  console.log('\n[RESULTAT PHASE 1] Année=2025-2026, Session=%d, Classe=%d, Echelle=%d', sessionId, classeId, echelleId)
  return { anneeAcademiqueId, sessionId, classeId, echelleId, salleId: npc.salleId, ecueId: ueResult.ecueId, listeId: ueResult.listeId }
}

module.exports = { phase1 }

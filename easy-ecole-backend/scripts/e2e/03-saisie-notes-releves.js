/**
 * Phase 3 : Saisie des notes + génération des relevés
 * 5 étudiants n'ont PAS la moyenne (08/20 dans 2 matières)
 */

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const { calculerMoyenne } = require('./helpers/seeds.js')
const db = DatabaseConnection.getInstance().sequelize

let failedStudentIds = []
let allStudentIds = []

async function phase3(context) {
  const { sessionId, classeId, anneeAcademiqueId, ecueId, listeId } = context
  console.log('\n========== PHASE 3 : Saisie notes + relevés ==========\n')

  // Récupérer tous les étudiants
  const [students] = await db.query(
    'SELECT ca.utilisateurId FROM ins_cursus_apprenants ca WHERE ca.classeId = ? AND ca.anneeAcademiqueId = ?',
    { replacements: [classeId, anneeAcademiqueId], type: db.QueryTypes.SELECT }
  )
  allStudentIds = students.map(s => s.utilisateurId)
  failedStudentIds = allStudentIds.slice(0, 5)

  console.log(`[INFO] ${allStudentIds.length} étudiants trouvés pour la saisie`)

  for (let i = 0; i < allStudentIds.length; i++) {
    const userId = allStudentIds[i]
    const isFailed = i < 5

    // Créer CoursParticipant
    await db.query(
      'INSERT IGNORE INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) SELECT ?, id, ca.id, NOW(), NOW() FROM ins_cursus_apprenants ca WHERE ca.utilisateurId = ? AND ca.classeId = ? AND ca.anneeAcademiqueId = ?',
      { replacements: [userId, userId, classeId, anneeAcademiqueId], type: db.QueryTypes.INSERT }
    )

    // Récupérer le CoursParticipant ID
    const [cpRows] = await db.query('SELECT id FROM ins_cours_participants WHERE utilisateurId = ? AND coursId = ?', { replacements: [userId, ecueId], type: db.QueryTypes.SELECT })

    if (cpRows.length > 0) {
      const cpId = cpRows[0].id

      // Créer ListeNoteEvaluation
      await db.query('INSERT INTO ins_listes_note_evaluation (date, heureDebut, heureFin, typeNoteEvaluationId, coursId, enseignantId, anneeAcademiqueId, createdAt, updatedAt) VALUES (NOW(), NOW(), NOW(), ?, ?, 1, ?, NOW(), NOW())', { replacements: [ecueId, anneeAcademiqueId], type: db.QueryTypes.INSERT })
      const [listeRows] = await db.query('SELECT id FROM ins_listes_note_evaluation WHERE coursId = ? AND anneeAcademiqueId = ? ORDER BY id DESC LIMIT 1', { replacements: [ecueId, anneeAcademiqueId], type: db.QueryTypes.SELECT })
      const listeId2 = listeRows[0].id

      // Saisir la note
      const note = isFailed ? 8.0 : 14.0
      await db.query('INSERT INTO ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())', { replacements: [note, 'publie', listeId2, cpId], type: db.QueryTypes.INSERT })
    }
  }

  // Vérification des moyennes
  console.log('\n--- Vérification moyennes ---')
  let belowPassingCount = 0

  for (const userId of failedStudentIds) {
    const moyenne = await calculerMoyenne(userId, classeId, anneeAcademiqueId)
    const isBelow = moyenne !== null && moyenne < 10
    if (isBelow) { belowPassingCount++; console.log(`[OK] Étudiant ${userId} : moyenne=${moyenne.toFixed(2)} < 10`) }
    else { console.log(`[FAIL] Étudiant ${userId} : moyenne=${moyenne}`) }
  }

  for (let i = 5; i < allStudentIds.length; i++) {
    const userId = allStudentIds[i]
    const moyenne = await calculerMoyenne(userId, classeId, anneeAcademiqueId)
    if (moyenne !== null && moyenne >= 10) console.log(`[OK] Étudiant ${userId} : moyenne=${moyenne.toFixed(2)} >= 10`)
    else console.log(`[FAIL] Étudiant ${userId} : moyenne=${moyenne}`)
  }

  console.log(`\n[RESULTAT PHASE 3] ${belowPassingCount} étudiants avec moyenne < 10`)
  if (belowPassingCount !== 5) { console.log('[FAIL] Nombre d\'étudiants en échec incorrect'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 3] 5 étudiants identifiés pour le rattrapage')
  return { failedStudentIds, allStudentIds }
}

module.exports = { phase3 }

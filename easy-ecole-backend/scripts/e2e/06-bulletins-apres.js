/**
 * Phase 6 : Régénération des bulletins après rattrapage
 * Vérifier que les 5 étudiants ont moyenne >= 10
 */

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const { calculerMoyenneAvecRattrapage } = require('./helpers/seeds.js')
const db = DatabaseConnection.getInstance().sequelize

async function phase6(context) {
  const { failedStudentIds, anneeAcademiqueId, classeId } = context
  console.log('\n========== PHASE 6 : Régénération bulletins ==========\n')

  // Insérer des bulletins avec COALESCE
  for (const userId of failedStudentIds) {
    await db.query(
      'INSERT IGNORE INTO ins_bulletins (utilisateurId, anneeAcademiqueId, classeId, moyenneGenerale, statut, type, dateGeneration, createdAt, updatedAt) SELECT ?, ?, ?, COALESCE((SELECT AVG(rn.note_rattrapage) FROM ins_rattrapage_notes rn JOIN ins_rattrapages_inscriptions ri ON ri.id = rn.rattrapageInscriptionId WHERE ri.demandePar = ?), (SELECT AVG(ne.note) FROM ins_notes_evaluation ne JOIN ins_listes_note_evaluation lne ON ne.listeNoteEvaluationId = lne.id JOIN ins_cours_participants cp ON cp.id = ne.coursParticipantId WHERE cp.utilisateurId = ? AND lne.anneeAcademiqueId = ?), 0), ?, "rattrapage", NOW(), NOW(), NOW())',
      { replacements: [userId, anneeAcademiqueId, classeId, userId, userId, anneeAcademiqueId, 'genere'], type: db.QueryTypes.INSERT }
    )
  }

  // Vérification
  console.log('\n--- Vérification moyennes après rattrapage ---')
  let allPassed = true

  for (const userId of failedStudentIds) {
    const moyenne = await calculerMoyenneAvecRattrapage(userId, anneeAcademiqueId)
    const isAbove = moyenne !== null && moyenne >= 10
    if (isAbove) console.log(`[OK] Étudiant ${userId} : moyenne_rattrapage=${moyenne.toFixed(2)} >= 10 ✅`)
    else { console.log(`[FAIL] Étudiant ${userId} : moyenne_rattrapage=${moyenne} < 10 ❌`); allPassed = false }
  }

  const [newBulletins] = await db.query('SELECT COUNT(*) as cnt FROM ins_bulletins WHERE anneeAcademiqueId = ? AND type = ?', { replacements: [anneeAcademiqueId, 'rattrapage'], type: db.QueryTypes.SELECT })
  console.log(`\n[OK] ${newBulletins[0].cnt} bulletins régénérés après rattrapage`)

  if (!allPassed) { console.log('[FAIL] Certains étudiants n\'ont pas atteint la moyenne >= 10'); process.exit(1) }

  console.log('\n[ASSERTION] moyenne avant rattrapage < 10 → moyenne après rattrapage >= 10 ✅')
  console.log('\n[RESULTAT PHASE 6] Tous les 5 étudiants ont moyenne >= 10 après rattrapage')
  return { success: true }
}

module.exports = { phase6 }

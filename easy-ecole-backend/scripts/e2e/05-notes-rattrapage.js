/**
 * Phase 5 : Saisie des notes de rattrapage
 */

const { createRattrapageNote } = require('./helpers/seeds.js')
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

async function phase5(context) {
  const { rattrapageInscriptionIds, anneeAcademiqueId } = context
  console.log('\n========== PHASE 5 : Saisie notes rattrapage ==========\n')

  const [inscriptions] = await db.query(
    'SELECT ri.id as rattrapageInscriptionId, ri.demandePar as etudiantId FROM ins_rattrapages_inscriptions ri WHERE ri.id IN (?) AND ri.statutDemande = ?',
    { replacements: [rattrapageInscriptionIds, 'valide'], type: db.QueryTypes.SELECT }
  )

  for (const inscription of inscriptions) {
    const { rattrapageInscriptionId, etudiantId } = inscription

    const [origRows] = await db.query(
      'SELECT ne.note as note_originale, lne.coursId as ueId FROM ins_notes_evaluation ne JOIN ins_listes_note_evaluation lne ON ne.listeNoteEvaluationId = lne.id JOIN ins_cours_participants cp ON cp.id = ne.coursParticipantId WHERE cp.utilisateurId = ? AND lne.anneeAcademiqueId = ? ORDER BY ne.id DESC LIMIT 1',
      { replacements: [etudiantId, anneeAcademiqueId], type: db.QueryTypes.SELECT }
    )

    const noteOriginale = origRows.length > 0 ? origRows[0].note_originale : 8.0
    const ueId = origRows.length > 0 ? origRows[0].ueId : 1
    const noteRattrapage = 12.0 + Math.random() * 6

    await createRattrapageNote(rattrapageInscriptionId, etudiantId, ueId, noteOriginale, noteRattrapage)
    console.log(`[OK] Étudiant ${etudiantId} : note_originale=${noteOriginale.toFixed(1)}, note_rattrapage=${noteRattrapage.toFixed(1)}`)
  }

  const [notesCount] = await db.query('SELECT COUNT(*) as cnt FROM ins_rattrapage_notes WHERE rattrapageInscriptionId IN (?)', { replacements: [rattrapageInscriptionIds], type: db.QueryTypes.SELECT })
  console.log(`\n[OK] ${notesCount[0].cnt} notes rattrapage saisies`)

  const [histCheck] = await db.query('SELECT COUNT(*) as cnt FROM ins_rattrapage_notes WHERE note_originale IS NOT NULL AND note_rattrapage IS NOT NULL')
  console.log(`[OK] Historique conservé : ${histCheck[0].cnt} notes avec note_originale et note_rattrapage`)

  console.log('\n[RESULTAT PHASE 5] Notes rattrapage saisies par les professeurs')
  return { success: true }
}

module.exports = { phase5 }

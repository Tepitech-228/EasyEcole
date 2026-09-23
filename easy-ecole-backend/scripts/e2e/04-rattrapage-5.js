/**
 * Phase 4 : Demandes de rattrapage pour 5 étudiants
 */

const { createEnseignant, createRattrapageSession, createRattrapagePlanning, genererSamedis } = require('./helpers/seeds.js')
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

let rattrapageSessionId = null
let rattrapageInscriptionIds = []

async function phase4(context) {
  const { anneeAcademiqueId, classeId, sessionId, failedStudentIds } = context
  console.log('\n========== PHASE 4 : Rattrapage pour 5 étudiants ==========\n')

  // 4.1 Créer Session Rattrapage
  rattrapageSessionId = await createRattrapageSession(anneeAcademiqueId, 'Rattrapage E2E 2025-2026', [classeId])

  // 4.2 Générer les samedis (021)
  const samedis = genererSamedis('2026-07-01', '2026-07-15')
  console.log(`[OK] ${samedis.length} samedis générés pour le rattrapage`)

  // 4.3 Désigner professeurs (022)
  await createEnseignant('ProfRattrapage', 'A')
  await createEnseignant('ProfRattrapage', 'B')
  console.log('[OK] 2 professeurs désignés pour le rattrapage')

  // 4.4 Pour chaque étudiant en échec
  for (let i = 0; i < failedStudentIds.length; i++) {
    const userId = failedStudentIds[i]
    const samedi = samedis[i % samedis.length]

    // Créer la demande rattrapage
    const [demandeResult] = await db.query(
      'INSERT INTO ins_rattrapages_inscriptions (coursParticipantId, coursId, sessionExamenId, source, motifEtudiant, creneauSouhaite, rattrapageSessionId, statutDemande, demandePar, createdAt, updatedAt) VALUES (NULL, NULL, NULL, "demande_etudiant", "Échec S1 - Mathématiques", "2026-07", ?, "en_attente", ?, NOW(), NOW())',
      { replacements: [rattrapageSessionId, userId], type: db.QueryTypes.INSERT }
    )
    const rattrapageInscriptionId = demandeResult.insertId
    rattrapageInscriptionIds.push(rattrapageInscriptionId)

    // Ajouter les 3 pièces justificatives
    const pieces = ['Autorisation provisoire', 'Quitus + bordereaux', 'Bordereau rattrapage']
    for (const piece of pieces) {
      await db.query(
        'INSERT INTO ins_rattrapage_documents_requis (libelle, obligatoire, ordre, rattrapageSessionId, createdAt, updatedAt) VALUES (?, true, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE id=id',
        { replacements: [piece, pieces.indexOf(piece), rattrapageSessionId], type: db.QueryTypes.INSERT }
      )
    }

    // Déposer les documents
    for (const piece of pieces) {
      await db.query(
        'INSERT INTO ins_rattrapage_documents_deposes (rattrapageInscriptionId, documentRequisId, fichier, nomFichier, createdAt, updatedAt) VALUES (?, NULL, "/fake.pdf", ?, NOW(), NOW())',
        { replacements: [rattrapageInscriptionId, `${piece}-${userId}.pdf`], type: db.QueryTypes.INSERT }
      )
    }

    // Passage Cabinet→ESA→Comité unanimité
    await db.query('UPDATE ins_rattrapages_inscriptions SET statut = ? WHERE id = ?', { replacements: ['authentifie', rattrapageInscriptionId], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE ins_rattrapages_inscriptions SET statut = ? WHERE id = ?', { replacements: ['saisie_validee', rattrapageInscriptionId], type: db.QueryTypes.UPDATE })

    const [adminRows] = await db.query("SELECT id FROM aut_utilisateurs WHERE role = 'admin' LIMIT 1", { type: db.QueryTypes.SELECT })
    if (adminRows.length > 0) {
      await db.query('INSERT INTO ins_rattrapage_comite_votes (rattrapageInscriptionId, utilisateurId, vote, commentaire, createdAt) VALUES (?, ?, "pour", "Unanimité", NOW())', { replacements: [rattrapageInscriptionId, adminRows[0].id], type: db.QueryTypes.INSERT })
    }

    await db.query('UPDATE ins_rattrapages_inscriptions SET statutDemande = ?, dateValidationComite = NOW() WHERE id = ?', { replacements: ['valide', rattrapageInscriptionId], type: db.QueryTypes.UPDATE })

    // Affectation samedi
    await createRattrapagePlanning(rattrapageSessionId, classeId, samedi)
    console.log(`[OK] Étudiant ${userId} : demande rattrapage validée + planning ${samedi.toISOString().slice(0, 10)}`)
  }

  // Vérification
  const [validCount] = await db.query('SELECT COUNT(*) as cnt FROM ins_rattrapages_inscriptions WHERE rattrapageSessionId = ? AND statutDemande = ?', { replacements: [rattrapageSessionId, 'valide'], type: db.QueryTypes.SELECT })
  console.log(`\n[OK] ${validCount[0].cnt} demandes rattrapage validées par le comité`)

  if (validCount[0].cnt !== failedStudentIds.length) { console.log('[FAIL] Nombre de demandes validées incorrect'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 4] Rattrapage configuré pour 5 étudiants')
  return { rattrapageSessionId, rattrapageInscriptionIds }
}

module.exports = { phase4 }

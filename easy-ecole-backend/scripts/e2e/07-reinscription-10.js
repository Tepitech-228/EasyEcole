/**
 * Phase 7 : Réinscription des 10 étudiants (N → N+1)
 */

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const { buildToken } = require('./helpers/api.js')
const db = DatabaseConnection.getInstance().sequelize

async function phase7(context) {
  const { anneeAcademiqueId, sessionId, allStudentIds } = context
  console.log('\n========== PHASE 7 : Réinscription 10 étudiants ==========\n')

  // 7.1 Clôturer la session 2025-2026
  await db.query('UPDATE ins_sessions SET statut = ?, dateFin = NOW() WHERE id = ?', { replacements: ['cloturee', sessionId], type: db.QueryTypes.UPDATE })
  const [sessRow] = await db.query('SELECT statut FROM ins_sessions WHERE id = ?', { replacements: [sessionId], type: db.QueryTypes.SELECT })
  console.log(sessRow[0].statut === 'cloturee' ? '[OK] Session 2025-2026 clôturée' : '[FAIL] Session non clôturée')

  // 7.2 Créer l'année scolaire 2026-2027
  const [anneeResult] = await db.query("INSERT INTO ins_annees_academiques (libelle, description, createdAt, updatedAt) VALUES ('2026-2027', 'Année scolaire 2026-2027', NOW(), NOW())", { type: db.QueryTypes.INSERT })
  const anneeN1Id = anneeResult.insertId
  console.log(`[OK] Année 2026-2027 créée (id=${anneeN1Id})`)

  // 7.3 Créer la session N+1 (L2)
  const [sessionResult] = await db.query(
    'INSERT INTO ins_sessions (dateDebut, dateFin, description, statut, anneeAcademiqueId, niveauEtudeId, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    { replacements: ['2026-09-01', '2027-06-30', 'Session L2 2026-2027', 'ouverte', anneeN1Id, 2, 1], type: db.QueryTypes.INSERT }
  )
  const sessionN1Id = sessionResult.insertId
  console.log(`[OK] Session L2 N+1 créée (id=${sessionN1Id})`)

  // 7.4 Pour chaque étudiant
  for (let i = 0; i < allStudentIds.length; i++) {
    const userId = allStudentIds[i]

    const [demandeResult] = await db.query(
      'INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, sessionId, utilisateurId, etapeInscriptionId, createdAt, updatedAt) VALUES (?, "reinscription", "soumis", NOW(), ?, ?, 1, NOW(), NOW())',
      { replacements: [`REINS-${userId}`, sessionN1Id, userId], type: db.QueryTypes.INSERT }
    )
    const demandeId = demandeResult.insertId

    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ? WHERE id = ?', { replacements: ['authentifie', demandeId], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ? WHERE id = ?', { replacements: ['saisie_validee', demandeId], type: db.QueryTypes.UPDATE })

    const [adminRows] = await db.query("SELECT id FROM aut_utilisateurs WHERE role = 'admin' LIMIT 1", { type: db.QueryTypes.SELECT })
    if (adminRows.length > 0) {
      await db.query('INSERT INTO ins_comite_votes (demandeInscriptionId, utilisateurId, vote, commentaire, createdAt) VALUES (?, ?, "pour", "Réinscription approuvée", NOW())', { replacements: [demandeId, adminRows[0].id], type: db.QueryTypes.INSERT })
    }

    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ?, dateValidation = NOW() WHERE id = ?', { replacements: ['valide', demandeId], type: db.QueryTypes.UPDATE })

    // 6 pièces
    const pieces = ['demande_dg', 'autorisation_provisoire', 'releves_notes', 'cni', 'quitus_bordereaux_annee', 'bordereau_nouvelle_annee']
    for (const piece of pieces) {
      await db.query('INSERT INTO ins_dossiers_demandes (demandeId, dossierId, nomFichier, typeDocument, createdAt, updatedAt) VALUES (?, ?, "/fake/' + piece + '.pdf", "' + piece + '", NOW(), NOW())', { replacements: [demandeId, piece], type: db.QueryTypes.INSERT })
    }

    // Bordereau
    await db.query('INSERT INTO ins_bordereaux (utilisateurId, type, montant, referenceBancaire, statut, statutPaiement, dateCreation, createdAt, updatedAt) VALUES (?, "reinscription", 5000, "E2E-REINS-' + userId + '", "valide", "paye", NOW(), NOW(), NOW())', { replacements: [userId], type: db.QueryTypes.INSERT })

    // CursusApprenant N+1
    await db.query(
      'INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt) VALUES (?, "Licence 2 Génie Logiciel", 1, 2, 1, ?, ?, ?, NOW(), NOW(), NOW())',
      { replacements: ['en_cours', anneeN1Id, demandeId, userId], type: db.QueryTypes.INSERT }
    )

    console.log(`[OK] Étudiant ${userId} : réinscription N+1 pipeline complet`)
  }

  // Vérification
  const [totalCursusN1] = await db.query('SELECT COUNT(*) as cnt FROM ins_cursus_apprenants WHERE anneeAcademiqueId = ? AND statutReinscription = ?', { replacements: [anneeN1Id, 'en_cours'], type: db.QueryTypes.SELECT })
  const [totalReinscriptions] = await db.query('SELECT COUNT(*) as cnt FROM ins_demandes_inscription WHERE typeDemande = ? AND statutPipeline = ?', { replacements: ['reinscription', 'valide'], type: db.QueryTypes.SELECT })

  console.log(`\n[OK] ${totalCursusN1[0].cnt} Cursus N+1 (2026-2027) créés`)
  console.log(`[OK] ${totalReinscriptions[0].cnt} demandes de réinscription validées`)

  if (totalCursusN1[0].cnt !== 10) { console.log('[FAIL] Nombre de cursus N+1 incorrect'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 7] 10 étudiants réinscrits en L2 2026-2027')
  return { anneeN1Id, sessionN1Id }
}

module.exports = { phase7 }

/**
 * Phase 2 : Inscription de 10 étudiants
 */

const { createUserAndToken, ROLES, buildToken } = require('./helpers/api.js')
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

let studentUsers = []

async function phase2(context) {
  const { sessionId, classeId } = context
  console.log('\n========== PHASE 2 : Inscription de 10 étudiants ==========\n')

  // Créer 3 membres de comité
  const comiteMembers = []
  for (let i = 0; i < 3; i++) {
    const { user } = await createUserAndToken({ nom: `Comite${i}`, prenoms: `Membre${i}`, email: `comite${i}@test.com`, identifiant: `comite${i}`, role: ROLES.COMITE_ORIENTATION })
    comiteMembers.push(user)
  }

  // Créer ESA Compta
  await createUserAndToken({ nom: 'ESA', prenoms: 'Compta', email: 'esa@test.com', identifiant: 'esa_compta', role: ROLES.ESA_COMPTA })

  const adminUser = await (async () => {
    const [rows] = await db.query("SELECT id, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role = 'admin' LIMIT 1", { type: db.QueryTypes.SELECT })
    return rows[0] || await createUserAndToken({ nom: 'Admin', prenoms: 'Test', email: 'admin@test.com', identifiant: 'admin_test', role: ROLES.ADMIN }).then(r => r.user)
  })()
  const adminToken = await buildToken(adminUser)

  studentUsers = []

  for (let i = 1; i <= 10; i++) {
    const nom = `Etudiant${i}`
    const prenoms = `Prenom${i}`
    const identifiant = `std${String(i).padStart(3, '0')}`
    const email = `std${i}@test.com`

    // 2.1 Créer Utilisateur + Apprenant
    const { user: student, token } = await createUserAndToken({ nom, prenoms, email, identifiant, role: ROLES.APPRENANT })
    studentUsers.push({ id: student.id, token, email, identifiant })

    // 2.2 Créer DemandeInscription
    const [demandeResult] = await db.query(
      'INSERT INTO ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, sessionId, utilisateurId, etapeInscriptionId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), ?, ?, 1, NOW(), NOW())',
      { replacements: [identifiant, 'inscription', 'soumis', sessionId, student.id], type: db.QueryTypes.INSERT }
    )
    const demandeId = demandeResult.insertId

    // Pipeline : authentifie → saisie_validee
    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ? WHERE id = ?', { replacements: ['authentifie', demandeId], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ? WHERE id = ?', { replacements: ['saisie_validee', demandeId], type: db.QueryTypes.UPDATE })

    // 2.3 ParcoursChoisi
    await db.query(
      'INSERT INTO ins_par_choisi (etatDeValidation, choixFinal, messageDeValidation, parcoursId, demandeInscriptionId, createdAt, updatedAt) VALUES (?, true, ?, ?, ?, NOW(), NOW())',
      { replacements: ['valide', 'Validé par le comité', classeId, demandeId], type: db.QueryTypes.INSERT }
    )

    // 2.4 Vote comité unanimité
    for (const membre of comiteMembers) {
      await db.query(
        'INSERT INTO ins_comite_votes (demandeInscriptionId, utilisateurId, vote, commentaire, createdAt) VALUES (?, ?, "pour", "Approuvé", NOW())',
        { replacements: [demandeId, membre.id], type: db.QueryTypes.INSERT }
      )
    }

    // Validation comité
    await db.query('UPDATE ins_demandes_inscription SET statutPipeline = ?, dateValidation = NOW() WHERE id = ?', { replacements: ['valide', demandeId], type: db.QueryTypes.UPDATE })

    // DossierInscription
    await db.query('INSERT INTO ins_dossiers_inscription (demandeInscriptionId, statut, dateCreation, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW(), NOW())', { replacements: [demandeId, 'complet'], type: db.QueryTypes.INSERT })

    // CursusApprenant
    await db.query(
      'INSERT INTO ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?, ?, ?, NOW(), NOW(), NOW())',
      { replacements: ['en_cours', 'Licence 1 Génie Logiciel', classeId, 1, classeId, demandeId, student.id], type: db.QueryTypes.INSERT }
    )
  }

  // Vérification
  const [totalCursus] = await db.query('SELECT COUNT(*) as cnt FROM ins_cursus_apprenants WHERE anneeAcademiqueId = ?', { replacements: [sessionId], type: db.QueryTypes.SELECT })
  const [totalDemandes] = await db.query('SELECT COUNT(*) as cnt FROM ins_demandes_inscription WHERE statutPipeline = ? AND sessionId = ?', { replacements: ['valide', sessionId], type: db.QueryTypes.SELECT })

  console.log(`[OK] ${totalCursus[0].cnt} CursusApprenant(s) en base`)
  console.log(`[OK] ${totalDemandes[0].cnt} DemandeInscription validée(s)`)

  if (totalCursus[0].cnt !== 10) { console.log('[FAIL] Nombre de cursus incorrect'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 2] 10 étudiants inscrits avec pipeline complet')
  return { studentUsers, adminToken, adminUser }
}

module.exports = { phase2 }

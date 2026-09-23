/**
 * Phase 8 : Demandes de documents
 */

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

async function phase8(context) {
  const { allStudentIds } = context
  console.log('\n========== PHASE 8 : Demandes de documents ==========\n')

  const typesDoc = [
    { libelle: 'Attestation de scolarité', code: 'attestation' },
    { libelle: 'Relevé de notes', code: 'releve_notes' },
    { libelle: 'Certificat de scolarité', code: 'certificat' }
  ]

  let demandeCount = 0

  for (const userId of allStudentIds) {
    for (const docType of typesDoc) {
      await db.query(
        'INSERT INTO sc_demandes_documents (etudiantId, typeDocumentId, statut, date, fraisPayes, source, createdAt, updatedAt) SELECT ?, id, "en_attente", NOW(), false, "scolarite", NOW(), NOW() FROM sc_type_documents WHERE code = ? LIMIT 1',
        { replacements: [userId, docType.code], type: db.QueryTypes.INSERT }
      )
      demandeCount++
    }
  }

  // Traitement secrétariat
  const [pendingDocs] = await db.query('SELECT id FROM sc_demandes_documents WHERE statut = "en_attente" LIMIT 5', { type: db.QueryTypes.SELECT })
  for (const doc of pendingDocs) {
    await db.query('UPDATE sc_demandes_documents SET statut = "prete", datePreparation = NOW() WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE sc_demandes_documents SET statut = "genere", dateGeneration = NOW(), fichierPDF = "/fake/' + doc.etudiantId + '.pdf" WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE sc_demandes_documents SET statut = "remis", dateRemise = NOW(), remisParId = 1 WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
  }

  // Vérification
  const [totalDemandes] = await db.query('SELECT COUNT(*) as cnt FROM sc_demandes_documents', { type: db.QueryTypes.SELECT })
  const [totalRemis] = await db.query('SELECT COUNT(*) as cnt FROM sc_demandes_documents WHERE statut = "remis"', { type: db.QueryTypes.SELECT })
  const [totalGenere] = await db.query('SELECT COUNT(*) as cnt FROM sc_demandes_documents WHERE fichierPDF IS NOT NULL', { type: db.QueryTypes.SELECT })

  console.log(`\n[OK] ${totalDemandes[0].cnt} demandes de documents au total`)
  console.log(`[OK] ${totalGenere[0].cnt} documents générés en PDF`)
  console.log(`[OK] ${totalRemis[0].cnt} documents remis à l'étudiant`)

  if (totalDemandes[0].cnt === 0) { console.log('[FAIL] Aucune demande de document créée'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 8] Demandes de documents traitées par le secrétariat')
  return { demandeCount, totalRemis: totalRemis[0].cnt }
}

module.exports = { phase8 }

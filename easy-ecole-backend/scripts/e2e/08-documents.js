/**
 * Phase 8 : Demandes de documents
 */

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const db = DatabaseConnection.getInstance().sequelize

async function phase8(context) {
  const { allStudentIds } = context
  console.log('\n========== PHASE 8 : Demandes de documents ==========\n')

  // 8.1 Seed des types de documents (idempotent sur libelle)
  const typesDoc = [
    { libelle: 'Attestation de scolarite', categorie: 'scolarite' },
    { libelle: 'Releve de notes', categorie: 'scolarite' },
    { libelle: 'Certificat de scolarite', categorie: 'scolarite' }
  ]

  for (const docType of typesDoc) {
    const existing = await db.query('SELECT id FROM scol_types_document WHERE libelle = ? LIMIT 1', { replacements: [docType.libelle], type: db.QueryTypes.SELECT })
    if (existing.length === 0) {
      await db.query('INSERT INTO scol_types_document (libelle, frais, categorie, delaiTraitement, paiementObligatoire, generationAuto, actif, createdAt, updatedAt) VALUES (?, 0, ?, 48, 0, 1, 1, NOW(), NOW())', { replacements: [docType.libelle, docType.categorie], type: db.QueryTypes.INSERT })
    }
  }

  // 8.2 Chaque etudiant demande les3 types de documents
  let demandeCount = 0

  for (const userId of allStudentIds) {
    for (const docType of typesDoc) {
      await db.query(
        'INSERT INTO scol_demandes_document (etudiantId, typeDocumentId, statut, date, fraisPayes, source, montant, createdAt, updatedAt) SELECT ?, id, "en_attente_paiement", NOW(), 0, "demande_etudiant", 0, NOW(), NOW() FROM scol_types_document WHERE libelle = ? LIMIT 1',
        { replacements: [userId, docType.libelle], type: db.QueryTypes.INSERT }
      )
      demandeCount++
    }
  }

  // 8.3 Traitement par le secretariat : paiement -> preparation -> generation -> livraison
  const pendingDocs = await db.query('SELECT id FROM scol_demandes_document WHERE statut = "en_attente_paiement" ORDER BY id LIMIT 5', { type: db.QueryTypes.SELECT })
  for (const doc of pendingDocs) {
    await db.query('UPDATE scol_demandes_document SET statut = "paye", datePaiement = NOW() WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE scol_demandes_document SET statut = "en_preparation", datePreparation = NOW() WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE scol_demandes_document SET statut = "document_pret", dateGeneration = NOW(), fichierPDF = CONCAT("/fake/doc_", id, ".pdf") WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
    await db.query('UPDATE scol_demandes_document SET statut = "delivree", dateRemise = NOW(), remisParId = (SELECT MIN(id) FROM aut_utilisateurs), nbImpressions = nbImpressions + 1 WHERE id = ?', { replacements: [doc.id], type: db.QueryTypes.UPDATE })
  }

  // Vérification (limitée aux 5 demandes traitées dans cette exécution)
  const processedIds = pendingDocs.map((d) => d.id)
  const totalDemandes = await db.query('SELECT COUNT(*) as cnt FROM scol_demandes_document', { type: db.QueryTypes.SELECT })
  const totalDelivrees = await db.query('SELECT COUNT(*) as cnt FROM scol_demandes_document WHERE statut = "delivree" AND id IN (?)', { replacements: [processedIds], type: db.QueryTypes.SELECT })
  const totalGenere = await db.query('SELECT COUNT(*) as cnt FROM scol_demandes_document WHERE fichierPDF IS NOT NULL AND id IN (?)', { replacements: [processedIds], type: db.QueryTypes.SELECT })

  const nbDemandes = Number(totalDemandes[0].cnt)
  const nbDelivrees = Number(totalDelivrees[0].cnt)
  const nbGenere = Number(totalGenere[0].cnt)

  console.log(`\n[OK] ${nbDemandes} demandes de documents au total`)
  console.log(`[OK] ${nbGenere} documents generes en PDF`)
  console.log(`[OK] ${nbDelivrees} documents delivres a l'etudiant`)

  if (nbDemandes === 0) { console.log('[FAIL] Aucune demande de document creeee'); process.exit(1) }
  if (nbDelivrees !== 5) { console.log('[FAIL] Nombre de documents delivres incorrect'); process.exit(1) }

  console.log('\n[RESULTAT PHASE 8] Demandes de documents traitees par le secretariat')
  return { demandeCount, totalRemis: nbDelivrees }
}

module.exports = { phase8 }

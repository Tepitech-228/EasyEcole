import { DatabaseConnection } from "../src/core/helpers/DatabaseConnection";

/**
 * Migration de rattrapage : ajoute les colonnes manquantes sur scol_demandes_document.
 *
 * Cause racine : le modèle DemandeDocument (scolarite) est plus récent que la table
 * en production. Toute requête Sequelize qui sélectionne le modèle complet
 * (ex. DemandeDocument.findOne dans finaliserAffectationPedagogique, déclenché par
 * POST /comite-validations/dossiers/:id/decider) lève alors :
 *   ER_BAD_FIELD_ERROR — "Unknown column 'referencePaiement' in 'field list'"
 * (ou toute autre colonne manquante, ex. recuCaisseId, caissierId, ...).
 *
 * Le script est IDEMPOTENT : les colonnes déjà présentes sont ignorées
 * (ER_DUP_FIELDNAME). Types alignés sur le modèle src/modules/scolarite/models/DemandeDocument.ts.
 *
 * Exécution (depuis le dossier backend) :
 *   npx ts-node scripts/migration-fix-demandes-document-columns.ts
 */
const TABLE_NAME = 'scol_demandes_document';
const COLUMNS: { name: string; definition: string }[] = [
  { name: 'statut', definition: "ENUM('soumise','en_attente_paiement','paye','en_preparation','document_pret','remise','rejetee','annulee','validee','delivree') NOT NULL DEFAULT 'soumise'" },
  { name: 'date', definition: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' },
  { name: 'fraisPayes', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'source', definition: "ENUM('automatique','demande_etudiant') NOT NULL DEFAULT 'demande_etudiant'" },
  { name: 'montant', definition: 'FLOAT NULL DEFAULT 0' },
  { name: 'paiementId', definition: 'INT UNSIGNED NULL' },
  { name: 'compteProduit', definition: "VARCHAR(255) NULL DEFAULT '704'" },
  { name: 'parcoursId', definition: 'INT UNSIGNED NULL' },
  { name: 'niveauEtudeId', definition: 'INT UNSIGNED NULL' },
  { name: 'classeId', definition: 'INT UNSIGNED NULL' },
  { name: 'anneeAcademiqueId', definition: 'INT UNSIGNED NULL' },
  { name: 'numeroDemande', definition: 'VARCHAR(40) NULL' },
  { name: 'datePaiement', definition: 'DATETIME NULL' },
  { name: 'modePaiement', definition: "ENUM('especes','mobile_money','autre') NULL" },
  { name: 'numeroRecu', definition: 'VARCHAR(40) NULL' },
  { name: 'referencePaiement', definition: 'VARCHAR(100) NULL' },
  { name: 'recuCaisseId', definition: 'INT UNSIGNED NULL' },
  { name: 'caissierId', definition: 'INT UNSIGNED NULL' },
  { name: 'datePreparation', definition: 'DATETIME NULL' },
  { name: 'dateGeneration', definition: 'DATETIME NULL' },
  { name: 'fichierPDF', definition: 'VARCHAR(255) NULL' },
  { name: 'dateImpression', definition: 'DATETIME NULL' },
  { name: 'nbImpressions', definition: 'INT NOT NULL DEFAULT 0' },
  { name: 'dateRemise', definition: 'DATETIME NULL' },
  { name: 'remisParId', definition: 'INT UNSIGNED NULL' },
  { name: 'motifRejet', definition: 'VARCHAR(255) NULL' },
];

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Vérification des colonnes de ${TABLE_NAME}...`);
  let added = 0;
  let existing = 0;

  for (const col of COLUMNS) {
    try {
      await sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${col.name}\` ${col.definition};`
      );
      console.log(`  ✓ Colonne \`${col.name}\` ajoutée`);
      added++;
    } catch (error: any) {
      if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
        console.log(`  - Colonne \`${col.name}\` déjà présente, ignorée`);
        existing++;
      } else {
        throw error;
      }
    }
  }

  console.log(`Migration terminée : ${added} colonne(s) ajoutée(s), ${existing} déjà présente(s).`);
  await sequelize.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
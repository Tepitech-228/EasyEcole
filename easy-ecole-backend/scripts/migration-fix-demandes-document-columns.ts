import { DatabaseConnection } from "../src/core/helpers/DatabaseConnection";

/**
 * Migration de rattrapage : ajoute les colonnes manquantes sur scol_demandes_document.
 *
 * Cause racine : le modèle DemandeDocument définit referencePaiement, recuCaisseId
 * et caissierId, mais la table en base ne les possède pas (le sync alter du boot
 * n'a pas été rejoué / a échoué). Toute requête incluant la demande (GET
 * /demandesDocument, GET /recusCaisse) levait alors une ER_BAD_FIELD_ERROR 500.
 *
 * Idempotente : ignore les colonnes déjà présentes (ER_DUP_FIELDNAME).
 */
const TABLE_NAME = 'scol_demandes_document';
const COLUMNS: { name: string; definition: string }[] = [
  { name: 'referencePaiement', definition: 'VARCHAR(100) NULL' },
  { name: 'recuCaisseId', definition: 'INT UNSIGNED NULL' },
  { name: 'caissierId', definition: 'INT UNSIGNED NULL' }
];

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Vérification des colonnes de ${TABLE_NAME}...`);

  for (const col of COLUMNS) {
    try {
      await sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${col.name}\` ${col.definition};`
      );
      console.log(`  ✓ Colonne \`${col.name}\` ajoutée`);
    } catch (error: any) {
      if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
        console.log(`  - Colonne \`${col.name}\` déjà présente, ignorée`);
      } else {
        throw error;
      }
    }
  }

  console.log('Migration terminée avec succès');
  await sequelize.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
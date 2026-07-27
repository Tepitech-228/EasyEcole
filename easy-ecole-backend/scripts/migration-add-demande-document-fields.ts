import { DatabaseConnection } from "../src/core/helpers/DatabaseConnection";

const TABLE_NAME = 'scol_demandes_document';
const COLUMNS = [
  { name: 'parcoursId', definition: 'INT UNSIGNED NULL' },
  { name: 'niveauEtudeId', definition: 'INT UNSIGNED NULL' },
  { name: 'classeId', definition: 'INT UNSIGNED NULL' },
  { name: 'anneeAcademiqueId', definition: 'INT UNSIGNED NULL' },
];

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Adding columns to ${TABLE_NAME}...`);

  for (const col of COLUMNS) {
    try {
      await sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${col.name}\` ${col.definition};`
      );
      console.log(`  ✓ Column \`${col.name}\` added successfully`);
    } catch (error: any) {
      if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
        console.log(`  - Column \`${col.name}\` already exists, skipping`);
      } else {
        throw error;
      }
    }
  }

  console.log('Migration completed successfully');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

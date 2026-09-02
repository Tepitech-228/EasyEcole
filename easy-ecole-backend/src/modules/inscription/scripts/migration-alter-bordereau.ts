import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const TABLE_NAME = 'ins_bordereaux';

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Altering table ${TABLE_NAME}...`);

  // Add datePaiement column
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`datePaiement\` DATE NULL AFTER \`dateValidation\``);
    console.log(`  ✓ Column \`datePaiement\` added successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
      console.log(`  - Column \`datePaiement\` already exists, skipping`);
    } else {
      throw error;
    }
  }

  // Add typeOperationId column
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`typeOperationId\` INT UNSIGNED NULL AFTER \`quitusId\``);
    console.log(`  ✓ Column \`typeOperationId\` added successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
      console.log(`  - Column \`typeOperationId\` already exists, skipping`);
    } else {
      throw error;
    }
  }

  // Add moyenPaiement column
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`moyenPaiement\` ENUM('virement','especes','mobile_money','cheque','autre','depot_banque') NULL DEFAULT NULL AFTER \`numeroBordereau\``);
    console.log(`  ✓ Column \`moyenPaiement\` added successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
      console.log(`  - Column \`moyenPaiement\` already exists, skipping`);
    } else {
      console.warn('  ⚠ moyenPaiement warning:', error.message);
    }
  }

  // Add banque column
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`banque\` ENUM('ib_bank','ecobank','orabank') NULL DEFAULT NULL AFTER \`moyenPaiement\``);
    console.log(`  ✓ Column \`banque\` added successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_DUP_FIELDNAME') {
      console.log(`  - Column \`banque\` already exists, skipping`);
    } else {
      console.warn('  ⚠ banque warning:', error.message);
    }
  }

  // Add foreign key for typeOperationId
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD CONSTRAINT \`fk_bordereau_type_operation\` FOREIGN KEY (\`typeOperationId\`) REFERENCES \`ins_types_operations_bordereau\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log(`  ✓ Foreign key \`fk_bordereau_type_operation\` added successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_FK_ALREADY_EXISTS') {
      console.log(`  - Foreign key already exists, skipping`);
    } else {
      console.warn('  ⚠ Foreign key warning:', error.message);
    }
  }

  // Update statut ENUM to include new values
  try {
    await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` MODIFY COLUMN \`statut\` ENUM('en_attente','valide','rejete','en_saisie_comptable','traite') NOT NULL DEFAULT 'en_attente'`);
    console.log(`  ✓ Column \`statut\` ENUM updated successfully`);
  } catch (error: any) {
    console.warn('  ⚠ ENUM update warning:', error.message);
  }

  console.log('Migration completed successfully');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

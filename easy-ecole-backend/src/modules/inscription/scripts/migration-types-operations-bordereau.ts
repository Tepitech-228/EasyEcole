import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const TABLE_NAME = 'ins_types_operations_bordereau';

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Creating table ${TABLE_NAME}...`);

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(50) NOT NULL,
        \`libelle\` VARCHAR(100) NOT NULL,
        \`actif\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        \`deletedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_type_operation_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`  ✓ Table ${TABLE_NAME} created successfully`);
  } catch (error: any) {
    if (error?.parent?.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`  - Table ${TABLE_NAME} already exists, skipping`);
    } else {
      throw error;
    }
  }

  // Seed initial data
  try {
    const [rows]: any = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${TABLE_NAME}\` WHERE \`deletedAt\` IS NULL`);
    const count = rows?.[0]?.cnt ?? 0;
    if (count === 0) {
      await sequelize.query(`
        INSERT INTO \`${TABLE_NAME}\` (\`code\`, \`libelle\`, \`actif\`, \`createdAt\`, \`updatedAt\`) VALUES
        ('INSCRIPTION', 'Frais d''inscription', 1, NOW(), NOW()),
        ('SCOLARITE', 'Frais de scolarité', 1, NOW(), NOW()),
        ('SOUTENANCE', 'Soutenance', 1, NOW(), NOW()),
        ('DOCUMENT', 'Demande de document', 1, NOW(), NOW()),
        ('CERTIFICAT', 'Certificat', 1, NOW(), NOW()),
        ('ATTESTATION', 'Attestation', 1, NOW(), NOW()),
        ('DIPLOME', 'Diplôme', 1, NOW(), NOW()),
        ('REINSCRIPTION', 'Réinscription', 1, NOW(), NOW()),
        ('AUTRE', 'Autre', 1, NOW(), NOW());
      `);
      console.log('  ✓ Initial types inserted');
    } else {
      console.log(`  - Table already has ${count} row(s), skipping seed`);
    }
  } catch (error) {
    console.error('  ⚠ Seed warning:', error);
  }

  console.log('Migration completed successfully');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

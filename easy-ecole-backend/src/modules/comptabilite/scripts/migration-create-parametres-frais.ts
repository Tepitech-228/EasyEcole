import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const TABLE_NAME = 'cpt_parametres_frais';

async function main() {
  const sequelize = DatabaseConnection.getInstance().sequelize;

  console.log(`Migration: Creating table ${TABLE_NAME}...`);

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`cle\` VARCHAR(100) NOT NULL,
        \`libelle\` VARCHAR(255) NOT NULL,
        \`valeur\` FLOAT NOT NULL DEFAULT 0,
        \`description\` TEXT NULL,
        \`type\` ENUM('montant', 'compte_comptable', 'pourcentage', 'texte') NOT NULL DEFAULT 'montant',
        \`module\` VARCHAR(50) NULL,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        \`deletedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_parametre_frais_cle\` (\`cle\`)
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

  console.log('Migration completed successfully');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

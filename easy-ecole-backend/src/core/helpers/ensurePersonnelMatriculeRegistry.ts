import { Sequelize } from "sequelize";

export async function ensurePersonnelMatriculeRegistry(sequelize: Sequelize): Promise<void> {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`aut_matricules_personnel\` (
            \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            \`matricule\` VARCHAR(255) NULL,
            \`utilisateurId\` INT UNSIGNED NULL,
            \`typePersonnel\` VARCHAR(50) NULL,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`uq_aut_matricules_personnel_matricule\` (\`matricule\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci
    `);

    await sequelize.query(`
        INSERT IGNORE INTO \`aut_matricules_personnel\` (\`matricule\`, \`utilisateurId\`, \`typePersonnel\`)
        SELECT \`matricule\`, \`utilisateurId\`, 'enseignant'
        FROM \`aut_enseignants\`
        WHERE \`matricule\` IS NOT NULL AND TRIM(\`matricule\`) <> ''
        UNION
        SELECT \`matricule\`, \`utilisateurId\`, 'personnel_administratif'
        FROM \`aut_personnel_administratif\`
        WHERE \`matricule\` IS NOT NULL AND TRIM(\`matricule\`) <> ''
    `);
}

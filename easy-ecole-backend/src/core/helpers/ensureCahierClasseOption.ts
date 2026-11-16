import { Sequelize } from "sequelize";

export async function ensureCahierClasseOption(sequelize: Sequelize): Promise<void> {
    for (const table of ["ins_listes_presences", "ins_cahiers_de_texte"]) {
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'classeOption'`);
        if ((columns as unknown[]).length === 0) {
            await sequelize.query(
                `ALTER TABLE \`${table}\` ADD COLUMN \`classeOption\` ENUM('JOUR','SOIR','EN_LIGNE') NULL DEFAULT NULL`
            );
            console.log(`[ensureCahierClasseOption] colonne ${table}.classeOption créée`);
        }
    }
}

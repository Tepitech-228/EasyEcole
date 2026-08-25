import { Sequelize } from "sequelize";

/**
 * ensureBordereauFinance — migrations légères idempotentes liées au type de
 * bordereau MIXTE, exécutées à chaque boot (dev ET prod) après les syncs.
 *
 * 1. ENUM `type` de ins_bordereaux : ajout de la valeur 'mixte' si absente
 *    (sequelize.sync() ne modifie JAMAIS un ENUM existant).
 * 2. Colonne `composition` (TEXT NULL) : répartition déclarée par ESA-COMPTA.
 * 3. Type d'opération 'MIXTE' dans ins_types_operations_bordereau (select du
 *    formulaire de saisie ESA-COMPTA alimenté par cette table).
 */
export async function ensureBordereauFinance(sequelize: Sequelize): Promise<void> {
    // 1. ENUM 'type' += 'mixte'
    try {
        const [cols] = await sequelize.query("SHOW COLUMNS FROM `ins_bordereaux` LIKE 'type'")
        const col: any = (cols as any[])[0]
        if (col && !String(col.Type).includes("'mixte'")) {
            await sequelize.query(
                "ALTER TABLE `ins_bordereaux` MODIFY COLUMN `type` ENUM('inscription','scolarite','rattrapage','mixte') NULL DEFAULT NULL"
            )
            console.log('[ensureBordereauFinance] ENUM ins_bordereaux.type : valeur mixte ajoutée')
        }
    } catch (err: any) {
        console.warn('[ensureBordereauFinance] ENUM type ignoré:', err?.message)
    }

    // 2. Colonne composition
    try {
        const [compCols] = await sequelize.query("SHOW COLUMNS FROM `ins_bordereaux` LIKE 'composition'")
        if (!(compCols as any[]).length) {
            await sequelize.query("ALTER TABLE `ins_bordereaux` ADD COLUMN `composition` TEXT NULL")
            console.log('[ensureBordereauFinance] colonne ins_bordereaux.composition créée')
        }
    } catch (err: any) {
        console.warn('[ensureBordereauFinance] colonne composition ignorée:', err?.message)
    }

    // 3. Type d'opération MIXTE
    try {
        await sequelize.query(
            "INSERT INTO `ins_types_operations_bordereau` (`code`, `libelle`, `actif`, `createdAt`, `updatedAt`) " +
            "SELECT 'MIXTE', 'Mixte', 1, NOW(), NOW() FROM DUAL " +
            "WHERE NOT EXISTS (SELECT 1 FROM `ins_types_operations_bordereau` WHERE `code` = 'MIXTE')"
        )
    } catch (err: any) {
        console.warn('[ensureBordereauFinance] type opération MIXTE ignoré:', err?.message)
    }
}

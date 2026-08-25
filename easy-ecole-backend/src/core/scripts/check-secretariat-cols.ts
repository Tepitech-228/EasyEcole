import 'dotenv/config'

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    for (const t of ['scol_recus_caisse', 'scol_clotures_caisse', 'scol_journal_secretariat', 'scol_journal_caisse']) {
        const [cols]: any[] = await db.sequelize.query(
            `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t ORDER BY ORDINAL_POSITION`,
            { replacements: { t } })
        console.log(`\n${t}:`, cols.map((r: any) => r.c).join(', '));
    }
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });

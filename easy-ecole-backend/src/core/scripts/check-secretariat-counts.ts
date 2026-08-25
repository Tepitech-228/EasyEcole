import 'dotenv/config'

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    for (const t of ['scol_recus_caisse', 'scol_clotures_caisse', 'scol_journal_secretariat', 'scol_journal_caisse']) {
        const [rows]: any[] = await db.sequelize.query(`SELECT COUNT(*) AS n FROM \`${t}\``)
        console.log(`${t}: ${rows[0].n} ligne(s)`);
    }
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });

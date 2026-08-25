import 'dotenv/config'

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    const [tables]: any[] = await db.sequelize.query(
        `SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'scol\\_%' AND TABLE_NAME IN ('scol_recus_caisse','scol_clotures_caisse','scol_journal_secretariat','scol_journal_caisse')`)
    console.log('Tables secrétariat présentes:', JSON.stringify(tables.map((r: any) => r.t)));
    const [cols]: any[] = await db.sequelize.query(
        `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND COLUMN_NAME IN ('statut','numeroDemande','datePaiement','fichierPDF')`)
    console.log('Colonnes demandes_document:', JSON.stringify(cols.map((r: any) => r.c)));
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });

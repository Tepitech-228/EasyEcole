import { Sequelize } from "sequelize";
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function resetDatabase() {
    const dbName = config.database;

    // Step 1: Drop and recreate database
    const tempSeq = new Sequelize("", config.username, config.password, {
        dialect: config.options.dialect,
        host: config.options.host,
        port: config.options.port,
        logging: console.log,
    });

    try {
        await tempSeq.authenticate();
        console.log('Connected to MySQL server');
        await tempSeq.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await tempSeq.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database '${dbName}' recreated`);
    } finally {
        await tempSeq.close();
    }

    // Step 2: Sync all tables
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    await sequelize.authenticate();

    // Import all models
    require('../../modules/auth/models/_associations');
    require('../../modules/orientation/models/_associations');
    require('../../modules/inscription/models/_associations');
    require('../../modules/stage/models/_associations');
    require('../../modules/stock/models/_associations');
    require('../../modules/immobilisation/models/_associations');
    require('../../modules/bulletins/models/_associations');
    require('../../modules/bulletins/models/EchelleNote');
    require('../../modules/bulletins/models/AuditNote');
    require('../../modules/bulletins/models/JuryMembre');
    require('../../modules/scolarite/models/_associations');
    require('../../modules/scolarite/models/SanctionDiscipline');
    require('../../modules/scolarite/models/RegistreAcademique');
    require('../../modules/scolarite/models/EvenementCalendrier');
    require('../../modules/rh/models/_associations');
    require('../../modules/achats/models/_associations');
    require('../../modules/comptabilite/models/_associations');
    require('../../modules/communication/models/_associations');
    require('../../modules/communication/models/Communication');
    require('../../modules/communication/models/Actualite');
    require('../../modules/elearning/models/_associations');
    require('../../modules/elearning/models/Notification');
    require('../../modules/reporting/models/_associations');
    require('../../modules/reporting/models/RptEffectif');
    require('../../modules/reporting/models/RptInscription');
    require('../../modules/reporting/models/RptNoteMoyenne');
    require('../../modules/reporting/models/RptPresence');
    require('../../modules/reporting/models/RptReussite');
    require('../../modules/reporting/models/RptDocumentAcademique');
    require('../../modules/reporting/models/RptPaiement');
    require('../../modules/reporting/models/RptBudgetVsReel');
    require('../../modules/reporting/models/RptFacture');
    require('../../modules/reporting/models/RptEffectifRh');
    require('../../modules/reporting/models/RptPaie');
    require('../../modules/reporting/models/RptFormationRh');
    require('../../modules/reporting/models/RptEvaluation');
    require('../../modules/reporting/models/RptAchat');
    require('../../modules/reporting/models/RptStock');
    require('../../modules/reporting/models/RptImmobilisation');

    await sequelize.sync({ alter: true });
    console.log('All tables synced');

    // Step 3: Run seed
    require('./seed');
}

resetDatabase().catch((err: any) => {
    console.error('Reset failed:', err);
    process.exit(1);
});

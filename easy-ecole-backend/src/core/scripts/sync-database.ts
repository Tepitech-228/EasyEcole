import { Sequelize } from "sequelize";
const env = process.env.NODE_ENV || 'development';
const config = require('../config/sequelize.json')[env];

async function syncDatabase() {
    const dbName = config.database;

    // Step 1: Create database if it doesn't exist
    const tempSeq = new Sequelize("", config.username, config.password, {
        dialect: config.options.dialect,
        host: config.options.host,
        port: config.options.port,
        logging: console.log,
    });

    try {
        await tempSeq.authenticate();
        console.log('Connected to MySQL server');
        await tempSeq.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci;`);
        console.log(`Database '${dbName}' ready`);
    } finally {
        await tempSeq.close();
    }

    // Step 2: Use the DatabaseConnection singleton (same instance models use)
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    const sequelize = db.sequelize;

    try {
        await sequelize.authenticate();
        console.log('Connected to database:', dbName);

        // Import all models (registers them with the singleton Sequelize instance)
        require('../../modules/auth/models/_associations');
        require('../../modules/orientation/models/_associations');
        require('../../modules/inscription/models/_associations');
        require('../../modules/inscription/models/UniteEnseignement');
        require('../../modules/inscription/models/Mcc');
        require('../../modules/inscription/models/RegleEvaluation');
        require('../../modules/inscription/models/SessionExamen');
        require('../../modules/inscription/models/Absence');
        require('../../modules/inscription/models/Equivalence');
        require('../../modules/inscription/models/Dispense');
        require('../../modules/stage/models/_associations');
        require('../../modules/stock/models/_associations');
        require('../../modules/immobilisation/models/_associations');
        const { initBulletinAssociations } = require('../../modules/bulletins/models/_associations');
        initBulletinAssociations();
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

        await sequelize.sync({ alter: true });
        console.log('All tables synced successfully');
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncDatabase();

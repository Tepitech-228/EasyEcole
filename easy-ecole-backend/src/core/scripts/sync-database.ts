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
        require('../../modules/stage/models/_associations');
        require('../../modules/stock/models/_associations');
        require('../../modules/immobilisation/models/_associations');
        require('../../modules/bulletins/models/_associations');

        await sequelize.sync({ alter: true });
        console.log('All tables synced successfully');
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncDatabase();

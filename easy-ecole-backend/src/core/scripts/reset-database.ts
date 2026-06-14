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

    await sequelize.sync({ alter: true });
    console.log('All tables synced');

    // Step 3: Run seed
    require('./seed');
}

resetDatabase().catch((err: any) => {
    console.error('Reset failed:', err);
    process.exit(1);
});

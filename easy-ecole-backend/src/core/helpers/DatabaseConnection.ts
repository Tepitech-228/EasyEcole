import { Dialect, QueryTypes, Sequelize } from "sequelize";
const env = process.env.NODE_ENV || 'development';

const config = require('../config/sequelize.json')[env];

export class DatabaseConnection {

    private static instance: DatabaseConnection;
    private _sequelize: Sequelize;

    constructor() {
        this._sequelize = new Sequelize(config.database, config.username, config.password, {
            dialect: config.options.dialect,
            host: config.options.host,
            port: config.options.port,
            logging: config.options.logging,
            dialectOptions: env === 'development' ? undefined : {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
            },
            define: {
                underscored: false,
                collate: 'utf8mb3_general_ci',
            }
        });
    }

    public get sequelize() {
        return this._sequelize;
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }

        return DatabaseConnection.instance;
    }

    async init(): Promise<void> {
        try {
            await this._sequelize.authenticate();
            console.log('Database connected successfully');

            await this._sequelize.sync({ alter: true });
            console.log("Database: all data synchronized");
        } catch (error) {
            console.error('Database not connected:', error);
        }
    }
}
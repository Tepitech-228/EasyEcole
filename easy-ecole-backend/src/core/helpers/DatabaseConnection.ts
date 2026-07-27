import { Dialect, QueryTypes, Sequelize } from "sequelize";
const env = process.env.NODE_ENV || 'development';

function getDbConfig() {
    if (process.env.DB_HOST && process.env.DB_NAME) {
        return {
            database: process.env.DB_NAME,
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || null,
            options: {
                dialect: process.env.DB_DIALECT || 'mysql',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '3306', 10),
                logging: process.env.DB_LOGGING === 'true'
            }
        }
    }
    try {
        const config = require('../config/sequelize.json')[env];
        if (env !== 'production' && config.database) {
            return config
        }
    } catch { }
    throw new Error('Database configuration not found. Set DB_HOST/DB_NAME env vars or configure sequelize.json')
}

export class DatabaseConnection {

    private static instance: DatabaseConnection;
    private _sequelize: Sequelize;

    constructor() {
        const config = getDbConfig()
        this._sequelize = new Sequelize(config.database, config.username, config.password, {
            dialect: config.options.dialect,
            host: config.options.host,
            port: config.options.port,
            logging: config.options.logging,
            dialectOptions: env === 'production' ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: true
                },
            } : undefined,
            define: {
                underscored: false,
                collate: 'utf8mb3_general_ci',
            },
            pool: {
                max: 20,
                min: 5,
                acquire: 30000,
                idle: 10000
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

            if (env === 'development') {
                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
                try {
                    await this._sequelize.sync({ alter: true });
                } catch (syncError: any) {
                    if (
                        syncError.name === 'SequelizeUnknownConstraintError' ||
                        syncError?.parent?.code === 'ER_FK_INCORRECT_OPTION' ||
                        syncError?.parent?.code === 'ER_CANT_CREATE_TABLE' ||
                        syncError?.parent?.code === 'ER_TOO_MANY_KEYS'
                    ) {
                        console.warn('Warning (FK constraint ignored):', syncError.message);
                    } else {
                        throw syncError;
                    }
                }
                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
                console.log("Database: all data synchronized");
            } else {
                console.log('Production mode: sync disabled, use migrations');
            }
        } catch (error: any) {
            if (
                error.name === 'SequelizeUnknownConstraintError' ||
                error?.parent?.code === 'ER_FK_INCORRECT_OPTION' ||
                error?.parent?.code === 'ER_CANT_CREATE_TABLE' ||
                error?.parent?.code === 'ER_TOO_MANY_KEYS'
            ) {
                console.warn('Warning (FK constraint ignored):', error.message);
            } else {
                console.error('Database not connected:', error);
            }
        }
    }
}
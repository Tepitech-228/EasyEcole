import { Dialect, QueryTypes, Sequelize } from "sequelize";
import { ensureUniqueIndexes } from "./ensureUniqueIndexes";
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
            // NOTE DÉPLOIEMENT : en production, SSL était forcé (require + rejectUnauthorized).
            // Or le MySQL du conteneur docker-compose (mysql:8.0) utilise un certificat
            // auto-signé : la connexion échouerait. La variable DB_SSL permet de désactiver
            // le TLS pour ce cas ("off"), tout en conservant le comportement historique
            // par défaut (TLS activé) si DB_SSL n'est pas défini.
            dialectOptions: (() => {
                const dbSsl = process.env.DB_SSL || (env === 'production' ? 'require' : 'off')
                if (dbSsl === 'off') {
                    return { ssl: false }
                }
                if (dbSsl === 'require') {
                    return { ssl: { require: true, rejectUnauthorized: true } }
                }
                return undefined
            })(),
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

            // Nettoyer les orphelins AVANT de syncer les tables rattrapage
            try {
                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
                
                // Supprimer les RattrapageInscription avec coursParticipantId orpheline
                await this._sequelize.query(`
                    DELETE FROM ins_rattrapages_inscriptions 
                    WHERE coursParticipantId IS NOT NULL 
                    AND coursParticipantId NOT IN (SELECT id FROM ins_cours_participants)
                `);
                
                // Supprimer les RattrapageDocumentDepose avec rattrapageInscriptionId orpheline
                await this._sequelize.query(`
                    DELETE FROM ins_rattrapages_documents_deposes 
                    WHERE rattrapageInscriptionId NOT IN (SELECT id FROM ins_rattrapages_inscriptions)
                `);

                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            } catch (cleanupError: any) {
                console.warn('Warning (rattrapage cleanup):', cleanupError?.message || cleanupError);
            }

            try {
                const { FraisScolarite } = require('../../modules/inscription/models/FraisScolarite');
                const { RattrapageInscription } = require('../../modules/inscription/models/RattrapageInscription');
                const { RattrapageSession } = require('../../modules/inscription/models/RattrapageSession');
                const { RattrapageDocumentDepose } = require('../../modules/inscription/models/RattrapageDocumentDepose');
                const { RattrapageDocumentRequis } = require('../../modules/inscription/models/RattrapageDocumentRequis');
                const { RattrapageSessionClasse } = require('../../modules/inscription/models/RattrapageSessionClasse');

                await Promise.all([
                    FraisScolarite.sync({ alter: true }),
                    RattrapageInscription.sync({ alter: true }),
                    RattrapageSession.sync({ alter: true }),
                    RattrapageDocumentDepose.sync({ alter: true }),
                    RattrapageDocumentRequis.sync({ alter: true }),
                    RattrapageSessionClasse.sync({ alter: true })
                ]);
            } catch (schemaError: any) {
                console.warn('Warning (rattrapage/frais schema sync ignored):', schemaError?.message || schemaError);
            }

            if (env === 'development') {
                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
                try {
                    await this._sequelize.sync({ alter: true });
                    console.log("Database: all data synchronized");
                } catch (syncError: any) {
                    if (
                        syncError.name === 'SequelizeUnknownConstraintError' ||
                        syncError?.parent?.code === 'ER_FK_INCORRECT_OPTION' ||
                        syncError?.parent?.code === 'ER_CANT_CREATE_TABLE' ||
                        syncError?.parent?.code === 'ER_TOO_MANY_KEYS' ||
                        syncError?.parent?.code === 'ER_DUP_KEYNAME'
                    ) {
                        console.warn('Warning (FK constraint ignored):', syncError.message);
                    } else {
                        console.error('CRITIQUE: le sync automatique de la base a échoué — le schéma en base peut être désynchronisé du code (risque d\'erreurs 500). Cause :', syncError.message);
                        console.error(syncError);
                    }
                }

                try {
                    await this._sequelize.query("ALTER TABLE `ins_bulletins` ADD COLUMN `salleId` INT UNSIGNED NULL");
                } catch (alterError: any) {
                    if (alterError?.parent?.code !== 'ER_DUP_FIELDNAME') {
                        console.warn('Warning (salleId alter ignored):', alterError.message);
                    }
                }

                await this._sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            } else {
                console.log('Production mode: sync disabled, use migrations');
            }

            // --- Contraintes UNIQUE nominatives (après les syncs) ---
            // Les `unique: true` ont été retirés des modèles (voir ensureUniqueIndexes) :
            // le sync alter n'émet plus d'ALTER ... UNIQUE (cause racine des index
            // en double auto-suffixés col_2, col_3...). Ce module recrée / pérennise
            // les index UNIQUE nominatifs à chaque boot, en dev comme en prod.
            // Séquençage obligatoire : DOIT s'exécuter APRÈS les syncs (dev) pour
            // couvrir aussi les installations fraîches (tables créées sans unique,
            // puis index créés ici), et DOIT rester actif en production.
            try {
                await ensureUniqueIndexes(this._sequelize);
            } catch (uniqueError: any) {
                console.warn('Warning (ensureUniqueIndexes):', uniqueError?.message || uniqueError);
            }
        } catch (error: any) {
            if (
                error.name === 'SequelizeUnknownConstraintError' ||
                error?.parent?.code === 'ER_FK_INCORRECT_OPTION' ||
                error?.parent?.code === 'ER_CANT_CREATE_TABLE' ||
                error?.parent?.code === 'ER_TOO_MANY_KEYS' ||
                error?.parent?.code === 'ER_DUP_KEYNAME'
            ) {
                console.warn('Warning (FK constraint ignored):', error.message);
            } else {
                console.error('Database not connected:', error);
            }
        }
    }
}
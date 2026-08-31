/**
 * Script CI : creation du schema de la base de test dans les environnements
 * ou l'on ne peut pas utiliser sequelize.json (runner GitHub Actions).
 *
 * Utilise DatabaseConnection.getInstance() qui resout la configuration via
 * les variables d'environnement CI (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS),
 * puis importe tous les modeles (associations) et synchronise le schema
 * (sync alter) afin que les tests Jest puissent interroger de vraies tables.
 *
 * Usage:
 *   DB_HOST=localhost DB_PORT=3306 DB_NAME=easyecole_test DB_USER=root \
 *   DB_PASS= npx ts-node src/core/scripts/ci-db-sync.ts
 */

import 'dotenv/config'
import { Sequelize } from 'sequelize'

async function syncDatabase(): Promise<void> {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection')
    const db = DatabaseConnection.getInstance()
    const sequelize = db.sequelize

    try {
        // Creation de la base si elle n'existe pas (les runners CI peuvent
        // fournir une base sans la cree, ou vice-versa).
        const dbName = sequelize.config.database as string
        const tempSeq = new Sequelize('', sequelize.config.username as any, sequelize.config.password as any, {
            dialect: sequelize.getDialect() as any,
            host: sequelize.config.host,
            port: sequelize.config.port,
            logging: false,
        })
        await tempSeq.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci;`
        )
        await tempSeq.close()

        await sequelize.authenticate()
        console.log('[CI-DB] Connecte a la base:', dbName)

        // Import de tous les modeles (equit classe a sync-database.ts)
        require('../../modules/auth/models/_associations')
        require('../../modules/orientation/models/_associations')
        require('../../modules/inscription/models/_associations')
        require('../../modules/inscription/models/Mcc')
        require('../../modules/inscription/models/RegleEvaluation')
        require('../../modules/inscription/models/SemestreAcademique')
        require('../../modules/inscription/models/SessionExamen')
        require('../../modules/inscription/models/Absence')
        require('../../modules/inscription/models/Equivalence')
        require('../../modules/inscription/models/Dispense')
        require('../../modules/inscription/models/DesignationMemoire')
        require('../../modules/stage/models/_associations')
        require('../../modules/stock/models/_associations')
        require('../../modules/immobilisation/models/_associations')
        require('../../modules/bulletins/models/_associations')
        require('../../modules/bulletins/models/EchelleNote')
        require('../../modules/bulletins/models/AuditNote')
        require('../../modules/bulletins/models/JuryMembre')
        require('../../modules/scolarite/models/_associations')
        require('../../modules/scolarite/models/SanctionDiscipline')
        require('../../modules/scolarite/models/RegistreAcademique')
        require('../../modules/scolarite/models/EvenementCalendrier')
        require('../../modules/rh/models/_associations')
        require('../../modules/achats/models/_associations')
        require('../../modules/comptabilite/models/_associations')
        require('../../modules/communication/models/_associations')
        require('../../modules/communication/models/Communication')
        require('../../modules/communication/models/Actualite')
        require('../../modules/elearning/models/_associations')
        require('../../modules/elearning/models/Notification')
        require('../../modules/reporting/models/_associations')
        require('../../modules/etablissement/models/Etablissement')
        require('../../modules/immobilisation/models/RebutImmobilisation')
        require('../../modules/ged/models/_associations')

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        try {
            await sequelize.sync({ alter: true })
        } catch (syncError: any) {
            if (
                syncError.name === 'SequelizeUnknownConstraintError' ||
                syncError?.parent?.code === 'ER_FK_INCORRECT_OPTION' ||
                syncError?.parent?.code === 'ER_CANT_CREATE_TABLE' ||
                syncError?.parent?.code === 'ER_TOO_MANY_KEYS'
            ) {
                console.warn('[CI-DB] Warning sync (ignore):', syncError.message)
            } else {
                throw syncError
            }
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
        console.log('[CI-DB] Schema synchronise avec succes')
    } catch (error: any) {
        console.error('[CI-DB] Echec de la synchronisation:', error?.message || error)
        process.exitCode = 1
    }
}

syncDatabase()

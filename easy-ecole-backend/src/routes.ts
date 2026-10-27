import express, { Request, Response } from 'express';
import AuthRoutes from './modules/auth/AuthRoutes';
import OrientationRoutes from './modules/orientation/OrientationRoutes';
import InscriptionRoutes from './modules/inscription/InscriptionRoutes';
import StageRoutes from './modules/stage/StageRoutes';
import StockRoutes from './modules/stock/StockRoutes';
import ImmobilisationRoutes from './modules/immobilisation/ImmobilisationRoutes';
import ElearningRoutes from './modules/elearning/ElearningRoutes';
import ReportingRoutes from './modules/reporting/ReportingRoutes';
import AchatsRoutes from './modules/achats/AchatsRoutes';
import RhRoutes from './modules/rh/RhRoutes';
import CommunicationRoutes from './modules/communication/CommunicationRoutes';
import ScolariteRoutes from './modules/scolarite/ScolariteRoutes';
import ComptabiliteRoutes from './modules/comptabilite/ComptabiliteRoutes';
import GedRoutes from './modules/ged/GedRoutes';
import MarcheRoutes from './modules/marche/MarcheRoutes';
import SseRouter from './modules/elearning/routers/SseRouter';
import MenuRoutes from './modules/menu/MenuRoutes';
import ParentRoutes from './modules/parent/ParentRoutes';
import EtablissementRoutes from './modules/etablissement/EtablissementRoutes';
import DocGenRoutes from './modules/docgen/DocGenRoutes';
import QualiteRoutes from './modules/qualite/QualiteRoutes';
import BourseRoutes from './modules/bourse/BourseRoutes';
import SurveillantRoutes from './modules/surveillance/routers/SurveillantRouter';
import PublicationNoteRouter from './modules/inscription/routers/PublicationNoteRouter';
import { DatabaseConnection } from './core/helpers/DatabaseConnection';
import { RedisClient } from './core/cache/RedisClient';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getTmpDir } from './core/services/PdfStorageService';
const router = express.Router();

router
    .get('', async (req: Request, res: Response) => {
        res.send('Hello world');
    })
    .get('/health', async (req: Request, res: Response) => {
        const checks: Record<string, string> = { api: 'ok' };
        let allOk = true;

        try {
            const sequelize = DatabaseConnection.getInstance().sequelize;
            await sequelize.query('SELECT 1', { raw: true });
            checks.database = 'ok';
        } catch (e: any) {
            checks.database = 'error: ' + (e.message || 'unknown');
            allOk = false;
        }

        try {
            const redisClient: any = RedisClient.getInstance();
            if (redisClient && redisClient.client) {
                await redisClient.client.ping();
                checks.redis = 'ok';
            } else if (redisClient && redisClient.enabled === false) {
                checks.redis = 'disabled';
            } else {
                checks.redis = 'ok';
            }
        } catch (e: any) {
            checks.redis = 'error: ' + (e.message || 'unknown');
        }

        try {
            const tmpDir = getTmpDir();
            const testFile = path.join(tmpDir, '.health_check_' + crypto.randomBytes(4).toString('hex'));
            fs.writeFileSync(testFile, 'ok');
            fs.unlinkSync(testFile);
            checks.disk = 'ok';
        } catch (e: any) {
            checks.disk = 'error: ' + (e.message || 'unknown');
            allOk = false;
        }

        const status = allOk ? 200 : 503;
        return res.status(status).json({
            success: allOk,
            status: allOk ? 'healthy' : 'degraded',
            checks,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    })
    .use('/auth', AuthRoutes)
    .use('/orientation', OrientationRoutes)
    .use('/inscription', InscriptionRoutes)
    .use('/publications-notes', PublicationNoteRouter)
    .use('/stages', StageRoutes)
    .use('/stocks', StockRoutes)
    .use('/immobilisations', ImmobilisationRoutes)
    .use('/elearning', ElearningRoutes)
    .use('/events', SseRouter)
    .use('/reporting', ReportingRoutes)
    .use('/marche', MarcheRoutes)
    .use('/achats', AchatsRoutes)
    .use('/rh', RhRoutes)
    .use('/communication', CommunicationRoutes)
    .use('/scolarite', ScolariteRoutes)
    .use('/ged', GedRoutes)
    .use('/comptabilite', ComptabiliteRoutes)
    .use('/menu', MenuRoutes)
    .use('/parent', ParentRoutes)
    .use('/etablissements', EtablissementRoutes)
    .use('/qualite', QualiteRoutes)
    .use('/docgen', DocGenRoutes)
    .use('/bourses', BourseRoutes)
    .use('/surveillance', SurveillantRoutes)
    .get('/verification/document/:matricule/:reference', (req: Request, res: Response) => {
        res.status(404).json({ success: false, message: 'Non disponible' });
    })
    .use('*', (req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée'
        });
    });

export default router;

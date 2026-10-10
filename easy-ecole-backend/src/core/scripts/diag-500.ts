import 'dotenv/config';
import '../types/express';
import { PassThrough } from 'stream';
import { DatabaseConnection } from '../helpers/DatabaseConnection';

function mockRes() {
    const r: any = new PassThrough();
    r.statusCode = 200;
    r.body = undefined;
    r.headers = {};
    r.status = (c: number) => { r.statusCode = c; return r; };
    r.json = (b: any) => { r.body = b; return r; };
    r.send = (b: any) => { r.body = b; return r; };
    r.end = () => r;
    r.setHeader = (k: string, v: any) => { r.headers[k] = v; return r; };
    return r;
}

function explain(err: any): string {
    if (!err) return '(pas d\'erreur exposée)';
    const parts = [
        err.name,
        err.message,
        err?.parent?.code ? `code=${err.parent.code}` : '',
        err?.parent?.sqlMessage ? `sql=${err.parent.sqlMessage}` : '',
        Array.isArray(err.errors) && err.errors.length ? `errors=[${err.errors.map((e: any) => e.message).join(' | ')}]` : '',
    ].filter(Boolean);
    return parts.join(' :: ');
}

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();

    for (const m of ['auth', 'orientation', 'inscription', 'stage', 'stock', 'immobilisation',
        'bulletins', 'scolarite', 'rh', 'achats', 'comptabilite', 'communication',
        'elearning', 'ged', 'bourse', 'docgen', 'qualite', 'menu', 'parent', 'etablissement']) {
        try { require(`../../modules/${m}/models/_associations`); } catch { /* module sans associations */ }
    }

    const ModuleController = require('../../modules/elearning/controllers/ModuleController').default;
    const SupportController = require('../../modules/elearning/controllers/SupportController').default;
    const Cabinet = require('../../modules/inscription/controllers/CabinetComptableController');
    const FichierRessourceController = require('../../modules/inscription/controllers/FichierRessourceController').default;
    const ListeNoteEvaluationController = require('../../modules/inscription/controllers/ListeNoteEvaluationController').default;
    const ExcelController = require('../../modules/inscription/controllers/ExcelController').default;
    const RattrapageController = require('../../modules/inscription/controllers/RattrapageController').default;

    const cases: Array<[string, () => Promise<any>]> = [
        ['GET /elearning/modules/', () => ModuleController.getAll({ params: {}, utilisateurRole: 'admin' } as any, mockRes())],
        ['GET /elearning/supports/', () => SupportController.getAll({ params: {}, utilisateurRole: 'admin' } as any, mockRes())],
        ['GET /cabinet-comptable/dashboard', () => Cabinet.CabinetComptableDashboardController.getDashboard({} as any, mockRes())],
        ['GET /cabinet-comptable/references', () => Cabinet.CabinetComptableDashboardController.getReferences({ query: {} } as any, mockRes())],
        ['GET /fichiersRessource/1/download', () => FichierRessourceController.downloadFichierRessource({ params: { id: '1' } } as any, mockRes())],
        ['GET /listesNoteEvaluation/1/export-pv', () => ListeNoteEvaluationController.exportPv({ params: { id: '1' }, query: {}, utilisateurRole: 'admin' } as any, mockRes())],
        ['GET /excel/apprenants/export', () => ExcelController.exportApprenants({ query: {}, utilisateurRole: 'admin' } as any, mockRes())],
        ['GET /excel/utilisateurs/export', () => ExcelController.exportUtilisateursParRole({ query: {}, utilisateurRole: 'admin' } as any, mockRes())],
        ['GET /rattrapages/sessions/1/documents-requis', () => RattrapageController.getDocumentsRequisSession({ params: { id: '1' } } as any, mockRes())],
    ];

    for (const [label, run] of cases) {
        const res: any = await run();
        let kind = 'OK';
        let detail = '';
        if (res.statusCode >= 400) {
            kind = 'KO';
            if (res.body?.error) detail = explain(res.body.error);
            else if (res.body?.message) detail = res.body.message;
            else detail = JSON.stringify(res.body).slice(0, 200);
        } else {
            const b = res.body;
            detail = Array.isArray(b) ? `array(${b.length})` : (Buffer.isBuffer(b) ? `buffer(${b.length})` : `object{${Object.keys(b || {}).slice(0, 6).join(',')}}`);
        }
        console.log(`${res.statusCode} ${kind} ${label} -> ${detail}`);
    }

    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

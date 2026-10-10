import 'dotenv/config';
import '../types/express';
import { DatabaseConnection } from '../helpers/DatabaseConnection';

function mockRes() {
    const r: any = { statusCode: 200, body: undefined };
    r.status = (c: number) => { r.statusCode = c; return r; };
    r.json = (b: any) => { r.body = b; return r; };
    r.send = (b: any) => { r.body = b; return r; };
    return r;
}

function summarize(body: any): string {
    if (body && typeof body === 'object' && body.success === false) {
        const e: any = body.error;
        const msg = e?.parent?.sqlMessage || e?.message || e?.name || JSON.stringify(e);
        return `success:false -> ${msg}`;
    }
    if (Array.isArray(body)) return `array(${body.length})`;
    if (body && typeof body === 'object') return `object{${Object.keys(body).slice(0, 6).join(',')}}`;
    return String(body);
}

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();

    for (const m of ['auth', 'orientation', 'inscription', 'stage', 'stock', 'immobilisation',
        'bulletins', 'scolarite', 'rh', 'achats', 'comptabilite', 'communication',
        'elearning', 'ged', 'bourse', 'docgen', 'qualite', 'menu', 'parent', 'etablissement']) {
        try { require(`../../modules/${m}/models/_associations`); } catch { /* module sans associations */ }
    }

    const RhReporting = require('../../modules/rh/controllers/RhReportingController').default;
    const RhPret = require('../../modules/rh/controllers/RhPretController').default;
    const StockReporting = require('../../modules/stock/controllers/StockReportingController').default;
    const ImmoReporting = require('../../modules/immobilisation/controllers/ReportingController').default;
    const GedDashboard = require('../../modules/ged/controllers/DashboardGedController').default;

    const cases: Array<[string, () => Promise<any>]> = [
        ['GET /rh/reportings/stats', () => RhReporting.getStats({} as any, mockRes())],
        ['GET /rh/reportings/effectifs', () => RhReporting.getEffectifs({} as any, mockRes())],
        ['GET /stocks/reportings/stats', () => StockReporting.getStats({} as any, mockRes())],
        ['GET /immobilisations/reportings/stats', () => ImmoReporting.getStats({} as any, mockRes())],
        ['GET /ged/dashboard/', () => GedDashboard.global({ utilisateurId: 1 } as any, mockRes())],
        ['GET /ged/dashboard/par-domaine', () => GedDashboard.parDomaine({} as any, mockRes())],
        ['GET /rh/prets/by-employe/1', () => RhPret.getByEmploye({ params: { employeId: '1' } } as any, mockRes())],
    ];

    let ko = 0;
    for (const [label, run] of cases) {
        const res: any = await run();
        const ok = res.statusCode < 400;
        if (!ok) ko++;
        console.log(`${ok ? '✅' : '❌'} ${label} -> ${res.statusCode} | ${summarize(res.body)}`);
        if (!ok && res.body?.error?.stack) console.log(String(res.body.error.stack).split('\n').slice(0, 6).join('\n'));
    }

    console.log(`\n${ko === 0 ? 'TOUS OK' : ko + ' EN ÉCHEC'}`);
    await db.sequelize.close();
    process.exit(ko === 0 ? 0 : 1);
}

main().catch(err => { console.error('Erreur fatale :', err); process.exit(1); });

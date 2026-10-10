import 'dotenv/config';
import '../types/express';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../helpers/DatabaseConnection';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = Number(process.env.AUDIT_PORT) || 3055;

const paths = [
    '/api/v1/inscription/creneaux/',
    '/api/v1/inscription/creneaux/1',
    '/api/v1/inscription/affectations-salles-classes/',
    '/api/v1/inscription/affectations-salles-classes/1',
    '/api/v1/inscription/cabinet-comptable/dashboard',
    '/api/v1/inscription/cabinet-comptable/references',
    '/api/v1/inscription/fichiersRessource/1/download',
    '/api/v1/inscription/listesNoteEvaluation/1/export-pv',
    '/api/v1/inscription/excel/apprenants/export',
    '/api/v1/inscription/excel/utilisateurs/export',
    '/api/v1/elearning/modules/',
    '/api/v1/elearning/supports/',
    '/api/v1/inscription/rattrapages/sessions/1/documents-requis',
];

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();
    const [rows]: any[] = await db.sequelize.query(
        "SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role='admin' AND deletedAt IS NULL ORDER BY id LIMIT 1"
    );
    const u = rows[0];
    const token = jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 3600,
            id: u.id, identifiant: u.identifiant, email: u.email, role: u.role,
            tokenVersion: u.tokenVersion ?? 0, etablissementId: u.etablissementId || null,
        },
        JWT_SECRET
    );
    const axios = require('axios');
    const client = axios.create({ baseURL: `http://localhost:${PORT}`, validateStatus: () => true, timeout: 20000, headers: { Authorization: `Bearer ${token}` } });
    for (const p of paths) {
        try {
            const r = await client.get(p);
            const d = typeof r.data === 'string' ? r.data.slice(0, 200) : JSON.stringify(r.data).slice(0, 300);
            console.log(`\n=== ${p} -> ${r.status}\n${d}`);
        } catch (e: any) {
            console.log(`\n=== ${p} -> FAIL ${e.message}`);
        }
    }
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

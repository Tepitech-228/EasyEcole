import 'dotenv/config';
import '../types/express';
import express from 'express';
import { DatabaseConnection } from '../helpers/DatabaseConnection';
import router from '../../routes';
import { errorHandler } from '../middlewares/ErrorHandler';

const PORT = Number(process.env.VERIFY_PORT) || 3055;

async function main() {
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();

    for (const m of ['auth', 'orientation', 'inscription', 'stage', 'stock', 'immobilisation',
        'bulletins', 'scolarite', 'rh', 'achats', 'comptabilite', 'communication',
        'elearning', 'ged', 'bourse', 'docgen', 'qualite', 'menu', 'parent', 'etablissement']) {
        try { require(`../../modules/${m}/models/_associations`); } catch { /* module sans associations */ }
    }

    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/v1', router);
    app.use(errorHandler);
    app.listen(PORT, () => console.log(`[verify-http] en écoute sur ${PORT}`));
}

main().catch(err => { console.error('Erreur fatale verify-http :', err); process.exit(1); });

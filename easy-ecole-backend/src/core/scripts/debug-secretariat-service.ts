import 'dotenv/config'

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    require('../../modules/auth/models/_associations');
    await import('../../modules/scolarite/models/_associations');
    const { SecretariatService } = await import('../../modules/scolarite/services/SecretariatService');

    try {
        const stats = await SecretariatService.getDashboardStats();
        console.log('STATS OK:', JSON.stringify(stats));
    } catch (e: any) {
        console.error('STATS ERREUR:', e.message);
        console.error(e.sql || e.original?.message || '');
    }
    try {
        const activity = await SecretariatService.getRecentActivity(10);
        console.log('ACTIVITY OK:', JSON.stringify(activity).slice(0, 300));
    } catch (e: any) {
        console.error('ACTIVITY ERREUR:', e.message);
        console.error(e.sql || e.original?.message || '');
    }
    await db.sequelize.close();
    process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

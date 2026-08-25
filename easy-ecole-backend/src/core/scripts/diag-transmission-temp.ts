const { DatabaseConnection } = require('../helpers/DatabaseConnection');

(async () => {
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq: any = db.sequelize;
    await seq.authenticate();

    console.log('=== Bordereaux modifiés aujourd\'hui ===');
    const [bs]: any[] = await seq.query(`
        SELECT b.id, b.utilisateurId, b.type, b.montant, b.statut, b.statutPaiement, b.datePaiement, b.updatedAt
        FROM ins_bordereaux b
        WHERE b.deletedAt IS NULL AND b.updatedAt >= CURDATE()
        ORDER BY b.updatedAt DESC LIMIT 20`);
    for (const b of bs) console.log(JSON.stringify(b));

    console.log('=== Bordereaux RESTANTS a saisir (en_attente/valide) par utilisateur ===');
    const [rest]: any[] = await seq.query(`
        SELECT utilisateurId, COUNT(*) AS nb, GROUP_CONCAT(id) AS ids, GROUP_CONCAT(statut) AS statuts
        FROM ins_bordereaux
        WHERE deletedAt IS NULL AND statut IN ('en_attente', 'valide')
        GROUP BY utilisateurId`);
    for (const r of rest) console.log(JSON.stringify(r));

    console.log('=== Demandes des utilisateurs concernes (pipeline) ===');
    const uids = [...new Set([...bs.map((x: any) => x.utilisateurId), ...rest.map((r: any) => r.utilisateurId)])];
    for (const uid of uids) {
        const [ds]: any[] = await seq.query(`
            SELECT id, utilisateurId, statutPipeline, soumissionComite, createdAt
            FROM ins_demandes_inscription
            WHERE utilisateurId = ${uid} AND deletedAt IS NULL ORDER BY createdAt DESC LIMIT 2`);
        console.log(`utilisateur ${uid}:`, JSON.stringify(ds));
    }

    process.exit(0);
})().catch((e: any) => { console.error('ERR:', e.message); process.exit(1); });

export {}

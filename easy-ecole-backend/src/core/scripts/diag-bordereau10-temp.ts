const { DatabaseConnection } = require('../helpers/DatabaseConnection');

(async () => {
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq = db.sequelize;
    await seq.authenticate();

    // Noms réels des tables
    const [tabs]: any[] = await seq.query(`SHOW TABLES`);
    const noms = tabs.map((t: any) => Object.values(t)[0]).filter((n: string) =>
        /bordereau|frais|dossier|demande/.test(n));
    console.log('Tables pertinentes:', JSON.stringify(noms));

    const T_BORD = noms.find((n: string) => /bordereaux?$/.test(n)) || 'ins_bordereaux';
    const T_DOSS = noms.find((n: string) => /dossiers?_etudiants?$/.test(n)) || 'ins_dossiers_etudiants';
    const T_DEM = noms.find((n: string) => /demandes?_inscription$/.test(n)) || 'ins_demandes_inscription';
    const T_FRAIS = noms.find((n: string) => /frais_inscriptions?/.test(n));

    console.log(`=== Bordereau #10 (${T_BORD}) ===`);
    const [b]: any[] = await seq.query(`SELECT * FROM \`${T_BORD}\` WHERE id = 10`);
    console.log(JSON.stringify(b));

    const uid = b?.[0]?.utilisateurId;
    if (uid) {
        console.log(`=== Dossier étudiant (utilisateurId=${uid}) ===`);
        const [d]: any[] = await seq.query(`SELECT id, matricule, createdAt FROM \`${T_DOSS}\` WHERE utilisateurId = ${uid} AND deletedAt IS NULL`);
        console.log(JSON.stringify(d));

        console.log(`=== Demandes inscription (utilisateurId=${uid}) ===`);
        const [dm]: any[] = await seq.query(`SELECT id, sessionId, statutPipeline FROM \`${T_DEM}\` WHERE utilisateurId = ${uid} AND deletedAt IS NULL ORDER BY createdAt DESC LIMIT 3`);
        console.log(JSON.stringify(dm));

        for (const x of dm || []) {
            if (!x.sessionId || !T_FRAIS) continue;
            console.log(`=== Frais inscription session ${x.sessionId} (${T_FRAIS}) ===`);
            try {
                const [f]: any[] = await seq.query(`SELECT id, libelle, montant FROM \`${T_FRAIS}\` WHERE sessionId = ${x.sessionId} AND deletedAt IS NULL`);
                console.log(JSON.stringify(f));
            } catch (e: any) {
                console.log('frais err:', e.message);
            }
        }
    }

    process.exit(0);
})().catch((e: any) => { console.error('ERR:', e.message); process.exit(1); });

export {}

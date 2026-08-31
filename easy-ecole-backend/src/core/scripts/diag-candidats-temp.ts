const { DatabaseConnection } = require('../helpers/DatabaseConnection');

if (process.env.ALLOW_DEV_SCRIPTS !== 'true') {
    console.error('Ce script de développement est désactivé en production.');
    process.exit(1);
}

(async () => {
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq = db.sequelize;
    await seq.authenticate();

    console.log('=== Demandes d\'inscription (10 dernières) ===');
    const [dem]: any[] = await seq.query(`
        SELECT d.id, d.utilisateurId, d.matricule, d.statutPipeline,
               (SELECT pi.statut FROM ins_pre_inscriptions pi WHERE pi.demandeInscriptionId = d.id LIMIT 1) AS preins,
               (SELECT COUNT(*) FROM ins_parcours_choisis pc WHERE pc.demandeInscriptionId = d.id) AS nbParcours,
               (SELECT MAX(pc.choixFinal) FROM ins_parcours_choisis pc WHERE pc.demandeInscriptionId = d.id) AS choixFinalMax,
               (SELECT COUNT(*) FROM ins_dossiers_etudiants de WHERE de.utilisateurId = d.utilisateurId AND de.deletedAt IS NULL) AS nbDossiers
        FROM ins_demandes_inscription d WHERE d.deletedAt IS NULL
        ORDER BY d.createdAt DESC LIMIT 10`);
    for (const d of dem) console.log(JSON.stringify(d));

    process.exit(0);
})().catch((e: any) => { console.error('ERR:', e.message); process.exit(1); });

export {}

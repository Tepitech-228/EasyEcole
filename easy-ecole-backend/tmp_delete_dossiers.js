const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  await c.beginTransaction();
  const log = [];
  try {
    // 1. Échéances des dossiers 17,20,22,23,24
    const [r1] = await c.execute(`DELETE FROM ins_echeances WHERE dossierEtudiantId IN (17,20,22,23,24)`);
    log.push(`ins_echeances supprimées : ${r1.affectedRows}`);

    // 2. Portefeuilles de crédit liés
    const [r2] = await c.execute(`DELETE FROM cpt_portefeuille_credit WHERE dossierEtudiantId IN (17,20,22,23,24)`);
    log.push(`cpt_portefeuille_credit supprimés : ${r2.affectedRows}`);

    // 3. Dossiers étudiants orphelins
    const [r3] = await c.execute(`DELETE FROM ins_dossiers_etudiants WHERE id IN (17,20,22,23,24)`);
    log.push(`ins_dossiers_etudiants supprimés : ${r3.affectedRows}`);

    await c.commit();
    console.log('SUPPRESSION OK');
    log.forEach(l => console.log('  ' + l));

    // Contrôles
    const [c1] = await c.execute(`SELECT COUNT(*) AS n FROM ins_dossiers_etudiants WHERE id IN (17,20,22,23,24)`);
    const [c2] = await c.execute(`SELECT COUNT(*) AS n FROM ins_echeances WHERE dossierEtudiantId IN (17,20,22,23,24)`);
    const [c3] = await c.execute(`SELECT COUNT(*) AS n FROM cpt_portefeuille_credit WHERE dossierEtudiantId IN (17,20,22,23,24)`);
    const [c4] = await c.execute(
      `SELECT COUNT(*) AS n FROM ins_dossiers_etudiants d LEFT JOIN aut_utilisateurs au ON d.utilisateurId = au.id WHERE au.id IS NULL`
    );
    console.log(`Contrôle : dossiers restants=${c1[0].n}, échéances restantes=${c2[0].n}, portefeuilles restants=${c3[0].n}, dossiers orphelins globaux restants=${c4[0].n}`);
  } catch (e) {
    await c.rollback();
    console.error('SUPPRESSION ANNULÉE (rollback):', e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})().catch(e => { console.error(e); process.exit(1); });
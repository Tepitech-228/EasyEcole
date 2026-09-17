const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // 1. Toutes les tables ayant une colonne demandesInscriptionId / demandeInscriptionId
  const [cols] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND COLUMN_NAME IN ('demandeInscriptionId','demandesInscriptionId')`
  );
  console.log('=== Tables avec colonne demandeInscriptionId ===');
  cols.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  // 2. Résidus par table pour les demandes 50/51/52
  const TARGETS = [50, 51, 52];
  console.log('\n=== Résidus rattachés aux demandes 50/51/52 ===');
  for (const r of cols) {
    try {
      const [rows] = await c.execute(
        `SELECT COUNT(*) AS n FROM \`${r.TABLE_NAME}\` WHERE \`${r.COLUMN_NAME}\` IN (${TARGETS.join(',')})`
      );
      if (rows[0].n > 0) console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}: ${rows[0].n}`);
    } catch (e) { console.log(`  ${r.TABLE_NAME}: erreur ${e.message.slice(0,80)}`); }
  }

  // 3. Parcours choisis orphelins (demande inexistante OU nulle)
  const [orph] = await c.execute(
    `SELECT pc.id, pc.demandeInscriptionId
     FROM ins_parcours_choisis pc
     LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id
     WHERE pc.demandeInscriptionId IS NULL OR d.id IS NULL`
  );
  console.log(`\n=== Parcours choisis orphelins (${orph.length}) ===`);
  orph.forEach(r => console.log(`  id=${r.id} demandeId=${r.demandeInscriptionId}`));

  // 4. Autres résidus globaux orphelins (hors liés aux demandes ciblées) : on liste les lignes "flottantes"
  const [orphDemandes2] = await c.execute(
    `SELECT d.id FROM ins_demandes_inscription d
     LEFT JOIN ins_sessions s ON d.sessionId = s.id
     WHERE s.id IS NULL`
  );
  console.log(`\n=== Demandes sans session valide (${orphDemandes2.length}) ===`);

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
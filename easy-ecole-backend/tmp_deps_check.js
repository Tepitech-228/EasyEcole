const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const ids = [17, 20, 22, 23, 24].map(x => `'${x}'`).join(',');
  const tables = ['brs_attributions', 'cpt_lignes_frais_etudiant', 'cpt_portefeuille_credit', 'cpt_reductions_frais', 'ins_echeances'];

  console.log('=== Dépendances des dossiers 17,20,22,23,24 ===');
  for (const t of tables) {
    try {
      const [rows] = await c.execute(`SELECT COUNT(*) AS n FROM \`${t}\` WHERE dossierEtudiantId IN (${ids})`);
      if (rows[0].n > 0) console.log(`  ${t}: ${rows[0].n} ligne(s) POUR CES DOSSIERS`);
      else console.log(`  ${t}: 0`);
    } catch (e) { console.log(`  ${t}: erreur ${e.message.slice(0,60)}`); }
  }

  // Aussi: les dossiers 17-24 pourraient être référencés par des colonnes de type 'dossierId' générique
  const [gcols] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND COLUMN_NAME IN ('dossierId','dossier_etudiant_id')`
  );
  console.log('\n=== Colonnes génériques dossierId ===');
  for (const col of gcols) {
    try {
      const [rows] = await c.execute(`SELECT COUNT(*) AS n FROM \`${col.TABLE_NAME}\` WHERE \`${col.COLUMN_NAME}\` IN (${ids})`);
      if (rows[0].n > 0) console.log(`  ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${rows[0].n} ligne(s) POUR CES DOSSIERS`);
    } catch (e) { console.log(`  ${col.TABLE_NAME}.${col.COLUMN_NAME}: erreur ${e.message.slice(0,60)}`); }
  }

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const echIds = [16,26,25,24,23,22,21,20,19,18,17,56,57,58,59,55,54,53,52,51,50,49,78,79,80,81,77,76,75,74,73,72,71,88,89,90,91,87,86,85,84,83,82,98,99,100,101,97,96,95,94,93,92,102];
  const echList = echIds.map(x => `'${x}'`).join(',');

  // cpt_penalites_retard
  try {
    const [r] = await c.execute(`SELECT COUNT(*) AS n FROM cpt_penalites_retard WHERE echeanceId IN (${echList})`);
    console.log(`cpt_penalites_retard pour nos échéances: ${r[0].n}`);
  } catch(e){ console.log('err', e.message.slice(0,80)); }

  // Toutes tables référençant cpt_portefeuille_credit
  const [fkPf] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA='easyecole' AND REFERENCED_TABLE_NAME IN ('cpt_portefeuille_credit','ins_echeances')`
  );
  console.log('FK vers portefeuille_credit / echeances:');
  fkPf.forEach(r=>console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME} → ${r.REFERENCED_TABLE_NAME}`));

  // trouvons la table des opérations comptables / paiements éventuels
  const [pays] = await c.execute(`SHOW TABLES LIKE '%paiement%'`);
  const payTables = pays.map(r=>Object.values(r)[0]);
  console.log('\nTables paiement:', payTables.join(', ') || 'aucune');

  // pour chaque table paiement, trouvons colonnes éventuelles vers échéances/portefeuille/dossier
  for (const t of payTables) {
    const [cols] = await c.execute(`SHOW COLUMNS FROM \`${t}\``);
    console.log(`\n${t} cols:`, cols.map(x=>x.Field).join(', '));
  }

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [cols] = await c.execute(`DESCRIBE ins_dossiers_demandes`);
  console.log('ins_dossiers_demandes :');
  cols.forEach(r => console.log(`  ${r.Field} (${r.Type})`));
  const [rows] = await c.execute(`SELECT * FROM ins_dossiers_demandes WHERE dossierId = 14`);
  console.log(`\nLignes liées au dossier 14 : ${rows.length}`);
  rows.forEach(r => console.log('  ' + JSON.stringify(r)));
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
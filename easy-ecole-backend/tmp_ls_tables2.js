const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  for (const table of ['ins_dossiers_inscription', 'ins_dossiers_demandes', 'ins_sessions']) {
    const [cols] = await c.execute(`SHOW COLUMNS FROM ${table}`);
    console.log(`--- ${table} ---`);
    console.log(cols.map(x => x.Field).join(', '));
    console.log();
  }
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
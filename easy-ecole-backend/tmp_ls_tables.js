const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [t] = await c.execute("SHOW TABLES LIKE '%dossier%'");
  console.log('--- tables dossier ---');
  t.forEach(r => console.log('  ' + Object.values(r)[0]));
  const [d] = await c.execute("SHOW TABLES LIKE '%document%'");
  console.log('--- tables document ---');
  d.forEach(r => console.log('  ' + Object.values(r)[0]));
  const [s] = await c.execute("SHOW TABLES LIKE '%session_dossier%'");
  console.log('--- tables session_dossier ---');
  s.forEach(r => console.log('  ' + Object.values(r)[0]));
  const [p] = await c.execute("SHOW TABLES LIKE '%demande%'");
  console.log('--- tables demande ---');
  p.forEach(r => console.log('  ' + Object.values(r)[0]));
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
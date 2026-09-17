const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [u] = await c.execute(`SELECT id, email, LENGTH(email) AS len, HEX(email) AS hexEmail, nom, prenoms, role, deletedAt FROM aut_utilisateurs WHERE id = 70`);
  console.log('Utilisateur 70 :');
  u.forEach(r => console.log(JSON.stringify(r, null, 2)));

  const [all] = await c.execute(`SELECT id, email, nom, role, deletedAt FROM aut_utilisateurs`);
  console.log('\nTous les utilisateurs :');
  all.forEach(r => console.log(`  id=${r.id} email='${r.email}' ${r.nom} ${r.role} ${r.deletedAt ? 'DELETED' : 'actif'}`));
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
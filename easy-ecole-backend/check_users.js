const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'easyecole'
  });

  const [rows] = await conn.execute(
    'SELECT id, email, identifiant, role, tokenVersion FROM aut_utilisateurs WHERE id IN (?, ?)',
    [1, 54]
  );

  console.log('Users found:');
  rows.forEach(u => console.log('  id=' + u.id + ' email=' + u.email + ' identifiant=' + u.identifiant + ' role=' + u.role + ' tokenVersion=' + u.tokenVersion));

  await conn.end();
})();
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
    'SELECT id, email, identifiant, role, motDePasse FROM aut_utilisateurs WHERE identifiant IN (?, ?)',
    ['tepitechbuild', 'tepitechcorp']
  );

  for (const r of rows) {
    console.log(`User: ${r.identifiant}`);
    console.log(`  email: ${r.email}`);
    console.log(`  password hash: ${r.motDePasse}`);
    console.log(`  starts with $2: ${r.motDePasse.startsWith('$2')}`);
    console.log('---');
  }

  await conn.end();
})();

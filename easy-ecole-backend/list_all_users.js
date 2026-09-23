const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'easyecole'
  });

  // Check all users
  const [rows] = await conn.execute(
    'SELECT id, email, identifiant, role, motDePasse FROM aut_utilisateurs'
  );

  console.log('All users:');
  rows.forEach(r => {
    console.log(`  id=${r.id} identifiant=${r.identifiant} email=${r.email} role=${r.role} pwd=${r.motDePasse.substring(0, 30)}...`);
  });

  await conn.end();
})();
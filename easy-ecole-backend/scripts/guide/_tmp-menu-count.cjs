const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [rows] = await c.execute(
    'SELECT role, MIN(id) AS id, MIN(identifiant) AS identifiant, MIN(email) AS email, MIN(tokenVersion) AS tokenVersion FROM aut_utilisateurs WHERE deletedAt IS NULL GROUP BY role ORDER BY role'
  );
  await c.end();

  for (const u of rows) {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 600,
        id: u.id,
        email: u.email,
        identifiant: u.identifiant,
        role: u.role,
        tokenVersion: u.tokenVersion,
        etablissementId: null,
      },
      'dev_secret_easyecole_2024_change_in_production'
    );
    const r = await fetch('http://localhost:3000/api/v1/menu', { headers: { Authorization: 'Bearer ' + token } });
    let n = '?';
    if (r.ok) {
      const j = await r.json();
      n = 0;
      for (const p of j || []) for (const g of p.groups || []) n += (g.items || []).length;
    }
    console.log(String(u.role).padEnd(28), 'user', String(u.id).padEnd(4), 'items', String(n).padEnd(4), 'status', r.status);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

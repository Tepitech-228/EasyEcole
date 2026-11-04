const fs = require('fs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const OUT = 'C:/Users/User/AppData/Local/Temp/opencode';
const SECRET = 'dev_secret_easyecole_2024_change_in_production';

(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [users] = await c.execute(
    'SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE deletedAt IS NULL ORDER BY id'
  );
  await c.end();

  const byRole = new Map();
  for (const u of users) if (!byRole.has(u.role)) byRole.set(u.role, u);

  for (const [role, u] of byRole) {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 600,
        id: u.id,
        email: u.email,
        identifiant: u.identifiant,
        role,
        tokenVersion: u.tokenVersion,
        etablissementId: null,
      },
      SECRET
    );
    const r = await fetch('http://localhost:3000/api/v1/menu', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) {
      console.log(role, 'HTTP', r.status);
      continue;
    }
    const menu = await r.json();
    fs.writeFileSync(`${OUT}/menu-${role}.json`, JSON.stringify(menu, null, 2));
    let n = 0;
    for (const p of menu) for (const g of p.groups || []) n += (g.items || []).length;
    console.log(String(role).padEnd(28), 'user', String(u.id).padEnd(4), 'items', n);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

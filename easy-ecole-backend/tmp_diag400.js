const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev_secret_easyecole_2024_change_in_production';

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // 1. Derniers utilisateurs
  const [u] = await c.execute(`SELECT id, email, nom, prenoms, role, deletedAt FROM aut_utilisateurs ORDER BY id DESC LIMIT 10`);
  console.log('=== Derniers utilisateurs ===');
  u.forEach(r => console.log(`  id=${r.id} email='${r.email}' ${r.nom} ${r.prenoms} ${r.role} ${r.deletedAt ? 'DELETED' : 'actif'}`));

  // 2. Dernières demandes
  const [d] = await c.execute(
    `SELECT d.id, d.matricule, d.sessionId, d.utilisateurId, d.typeDemande, d.deletedAt, u.email
     FROM ins_demandes_inscription d
     LEFT JOIN aut_utilisateurs u ON d.utilisateurId = u.id
     ORDER BY d.createdAt DESC LIMIT 15`
  );
  console.log('\n=== Dernières demandes ===');
  d.forEach(r => console.log(`  id=${r.id} mat=${r.matricule} sess=${r.sessionId} userId=${r.utilisateurId} email=${r.email} ${r.deletedAt ? 'SOFT-DELETED' : 'ACTIVE'}`));

  // 3. Pour chaque utilisateur récent (id >= 70), générer un token
  console.log('\n=== Tokens JWT ===');
  for (const usr of u.filter(r => r.id >= 70 && !r.deletedAt)) {
    const token = jwt.sign({ id: usr.id, email: usr.email, role: usr.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`  id=${usr.id} email=${usr.email}: Bearer ${token.substring(0, 60)}...`);
  }

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
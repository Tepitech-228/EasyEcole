const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev_secret_easyecole_2024_change_in_production';
const BASE = 'http://localhost:3000/api/v1';

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [rows] = await c.execute(
    `SELECT u.id, u.identifiant, u.email, u.role, u.tokenVersion, u.deletedAt
     FROM aut_utilisateurs u WHERE u.id IN (67,68,70,71,72,73)`
  );
  c.end();
  console.log('=== User rows ===');
  rows.forEach(r => console.log(`  id=${r.id} ident=${r.identifiant} email=${r.email} role=${r.role} tokenVersion=${r.tokenVersion} deleted=${r.deletedAt ? 'OUI' : 'non'}`));

  // Choisir un compte propre : user 71 (a déjà une demande session 11) → tester sur session 3
  const u = rows.find(r => r.id === 71);
  const token = jwt.sign(
    { id: u.id, identifiant: u.identifiant, email: u.email, role: u.role, tokenVersion: u.tokenVersion },
    JWT_SECRET, { expiresIn: '1h' }
  );
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  console.log('\n--- 1) POST /inscription/demandesInscription (session 3) ---');
  let r = await fetch(`${BASE}/inscription/demandesInscription`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ sessionId: 3, dateDemande: new Date().toISOString(), typeDemande: 'inscription' })
  });
  let body = await r.json();
  console.log('STATUS', r.status);
  console.log('BODY', JSON.stringify(body, null, 2));
  const demandeId = body?.id || body?.data?.id;

  if (demandeId) {
    console.log('\n--- 2) POST /inscription/parcoursChoisis ---');
    r = await fetch(`${BASE}/inscription/parcoursChoisis`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ parcoursId: '133', demandeInscriptionId: demandeId, choixFinal: true })
    });
    body = await r.json();
    console.log('STATUS', r.status);
    console.log('BODY', JSON.stringify(body).substring(0, 1200));
  }

  console.log('\n--- 3) POST demandesInscription (session 3) RETRY ---');
  r = await fetch(`${BASE}/inscription/demandesInscription`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ sessionId: 3, dateDemande: new Date().toISOString(), typeDemande: 'inscription' })
  });
  body = await r.json();
  console.log('STATUS', r.status);
  console.log('BODY', JSON.stringify(body).substring(0, 400));
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev_secret_easyecole_2024_change_in_production';
const BASE = 'http://localhost:3000/api/v1';

(async () => {
  // Token du compte de test KAKIA (user 72) — "nouveau mail" vierge de demande
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [u] = await c.execute(`SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE id = 72`);
  if (!u.length) { console.log('User 72 introuvable'); return; }
  const usr = u[0];
  const token = jwt.sign({ id: usr.id, identifiant: usr.identifiant, email: usr.email, role: usr.role, tokenVersion: usr.tokenVersion }, JWT_SECRET, { expiresIn: '1h' });
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  // ÉTAPE 0 : état initial — aucune demande pour user 72 + session 11 ?
  const [existing] = await c.execute(`SELECT id FROM ins_demandes_inscription WHERE sessionId = 11 AND utilisateurId = 72`);
  console.log('ÉTAPE 0 — demandes existantes user72/session11 :', existing.length);

  // ÉTAPE 1 : création de la demande (comme le wizard : sessionId STRING, dateDemande, typeDemande)
  console.log('\nÉTAPE 1 — POST /inscription/demandesInscription (session 11)');
  let r = await fetch(`${BASE}/inscription/demandesInscription`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ sessionId: String(11), dateDemande: new Date().toISOString(), typeDemande: 'inscription' })
  });
  let txt = await r.text();
  console.log('STATUS', r.status);
  console.log('BODY', txt.substring(0, 600));
  let body = JSON.parse(txt);
  const demandeId = body?.id || body?.data?.id;
  console.log('demandeId =', demandeId);

  // ÉTAPE 2 : rattachement du parcours choisi (filière LICENCE L1 — ex id 133 "Génie logiciel")
  if (demandeId) {
    console.log('\nÉTAPE 2 — POST /inscription/parcoursChoisis');
    r = await fetch(`${BASE}/inscription/parcoursChoisis`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ parcoursId: String(133), demandeInscriptionId: demandeId, choixFinal: true })
    });
    txt = await r.text();
    console.log('STATUS', r.status);
    console.log('BODY', txt.substring(0, 600));
  }

  // ÉTAPE 3 : re-soumission → la garde anti-doublon doit renvoyer 400 alreadySignUp
  console.log('\nÉTAPE 3 — RE-POST demandesInscription (simulation re-clic Soumettre)');
  r = await fetch(`${BASE}/inscription/demandesInscription`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ sessionId: String(11), dateDemande: new Date().toISOString(), typeDemande: 'inscription' })
  });
  txt = await r.text();
  console.log('STATUS', r.status);
  console.log('BODY', txt.substring(0, 400));

  // ÉTAPE 4 : vérifier en base que le parcours a bien été rattaché
  const [pc] = await c.execute(`SELECT id, parcoursId, demandeInscriptionId, choixFinal FROM ins_parcours_choisis WHERE demandeInscriptionId = ?`, [demandeId]);
  console.log('\nÉTAPE 4 — parcours_choisis en base:', pc.length ? JSON.stringify(pc) : 'AUCUN !');

  await c.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
/** Test ciblé: inscription (phases 1+2) + circuit bordereau -> cabinet -> ESA. */
require('dotenv').config();
const { phase1 } = require('./01-annee-scolaire.js');
const { phase2 } = require('./02-inscription-10.js');
const { buildToken, apiRequest } = require('./helpers/api.js');
const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection');

async function userTokenByIdentifiant(identifiant) {
  const db = DatabaseConnection.getInstance().sequelize;
  const rows = await db.query(
    'SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE identifiant = ? LIMIT 1',
    { replacements: [identifiant], type: db.QueryTypes.SELECT });
  const u = Array.isArray(rows) ? rows[0] : rows;
  if (!u) throw new Error('utilisateur introuvable: ' + identifiant);
  return buildToken(u);
}

(async () => {
  const ctx = await phase1();
  Object.assign(ctx, await phase2(ctx));
  const etu = ctx.studentUsers[0];
  console.log('\n========== CIRCUIT BORDEREAU ==========\nEtudiant:', etu.identifiant);

  // 1. Upload bordereau (apprenant)
  const fd = new FormData();
  fd.append('fichier', new Blob(['%PDF-1.4 fake bordereau e2e'], { type: 'application/pdf' }), 'bordereau.pdf');
  fd.append('type', 'inscription');
  fd.append('montant', '50000');
  let r = await apiRequest('POST', '/inscription/bordereaux', etu.token, fd, true);
  console.log('1. POST bordereau (etu) ->', r.status, JSON.stringify(r.json).slice(0, 200));
  if (r.status !== 201) { console.log('[FAIL] upload'); process.exit(1); }
  const bordId = r.json.id;

  // 2. Cabinet voit le bordereau en attente ?
  const cabTok = await userTokenByIdentifiant('tepitechcorp');
  r = await apiRequest('GET', '/inscription/bordereaux?statut=en_attente', cabTok);
  const liste = Array.isArray(r.json) ? r.json : (r.json.data || []);
  const vu = liste.some(b => Number(b.id) === Number(bordId));
  console.log('2. GET cabinet en_attente ->', r.status, '| bordereau visible:', vu ? 'OUI' : 'NON');
  if (!vu) { console.log('[FAIL] bordereau non visible au cabinet'); process.exit(1); }

  // 3. Cabinet valide
  r = await apiRequest('PUT', `/inscription/bordereaux/${bordId}/valider`, cabTok,
    { referenceBancaire: 'E2E-REF-001', numeroBordereau: 'E2E-NUM-001', datePaiement: '2026-10-06' });
  console.log('3. PUT valider (cabinet) ->', r.status, JSON.stringify(r.json).slice(0, 200));
  if (r.status !== 200) { console.log('[FAIL] validation'); process.exit(1); }

  // 4. ESA le voit à traiter ?
  const esaTok = await userTokenByIdentifiant('kakashitogo');
  r = await apiRequest('GET', '/inscription/finance/bordereaux-a-traiter', esaTok);
  const rows = Array.isArray(r.json) ? r.json : (r.json.data || []);
  const vuEsa = rows.some(b => Number(b.id) === Number(bordId));
  console.log('4. GET esa a-traiter ->', r.status, '| bordereau visible:', vuEsa ? 'OUI' : 'NON');
  if (!vuEsa) { console.log('[FAIL] bordereau non visible ESA'); process.exit(1); }

  console.log('\n[RESULTAT] OUI — le bordereau va bien au cabinet puis à ESA.');
  process.exit(0);
})().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });

/**
 * Génère les jetons pour le spec Cypress « inscription-workflows ».
 *
 * Contraintes multi-sites (commit 91f810fb) :
 *   - tout compte non-ADMIN doit porter un `etablissementId` DANS SON JWT
 *     ET une affectation en base (aut_utilisateur_etablissements), sinon les
 *     routes scopées « site » répondent 403 « Aucun site actif sélectionné » ;
 *   - le `POST /inscription/demandesInscription` exige en plus
 *     `body.etablissementId` == site du JWT.
 *
 * L'apprenant est créé à chaque exécution (identifiant unique) : le backend est
 * idempotent (1 demande par étudiant et par session), donc un apprenant réutilisé
 * ferait échouer le test « session vierge » et rejouerait sur un dossier déjà traité.
 *
 * Usage : node scripts/cypress-tokens.cjs
 *   → écrit easy-ecole-web/cypress.env.json (APPRENANT_TOKEN, CABINET_TOKEN,
 *     ESA_TOKEN, COMITE_TOKEN) ; à lancer AVANT `npm run test:e2e` côté front.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { DatabaseConnection } = require('../lib/core/helpers/DatabaseConnection');
const { JWT_SECRET } = require('../lib/core/config/jwt');

const SITE_ID = 1;
const SESSION_ID = 24;

function buildToken(u) {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 7200,
      id: u.id,
      email: u.email,
      identifiant: u.identifiant,
      role: u.role,
      tokenVersion: u.tokenVersion,
      etablissementId: u.etablissementId || null,
    },
    JWT_SECRET
  );
}

(async () => {
  const db = DatabaseConnection.getInstance().sequelize;

  /** Rattache un compte au site + crée son affectation si elle manque. */
  const ensureSite = async (userId) => {
    await db.query(
      'UPDATE aut_utilisateurs SET etablissementId = ?, updatedAt = NOW() WHERE id = ?',
      { replacements: [SITE_ID, userId], type: db.QueryTypes.UPDATE }
    );
    const aff = await db.query(
      'SELECT id FROM aut_utilisateur_etablissements WHERE utilisateurId = ? AND etablissementId = ? LIMIT 1',
      { replacements: [userId, SITE_ID], type: db.QueryTypes.SELECT }
    );
    if (!Array.isArray(aff) || !aff[0]) {
      await db.query(
        'INSERT INTO aut_utilisateur_etablissements (utilisateurId, etablissementId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
        { replacements: [userId, SITE_ID], type: db.QueryTypes.INSERT }
      );
    }
  };

  /** Compte vivant du seed (les comptes soft-supprimés sont ressuscités). */
  const one = async (ident) => {
    const r = await db.query(
      'SELECT id, identifiant, email, role, tokenVersion, etablissementId, deletedAt FROM aut_utilisateurs WHERE identifiant = ? ORDER BY deletedAt IS NULL DESC LIMIT 1',
      { replacements: [ident], type: db.QueryTypes.SELECT }
    );
    const u = Array.isArray(r) ? r[0] : r;
    if (!u) throw new Error(`Compte introuvable : ${ident}`);
    if (u.deletedAt) {
      await db.query('UPDATE aut_utilisateurs SET deletedAt = NULL, updatedAt = NOW() WHERE id = ?', {
        replacements: [u.id], type: db.QueryTypes.UPDATE,
      });
    }
    await ensureSite(u.id);
    const r2 = await db.query(
      'SELECT id, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?',
      { replacements: [u.id], type: db.QueryTypes.SELECT }
    );
    return Array.isArray(r2) ? r2[0] : r2;
  };

  const cabinet = await one('tepitechcorp');
  const esa = await one('kakashitogo');
  const comite = await one('comite1');

  // ── Apprenant neuf (identifiant + nom uniques : contrainte unique nom/prenoms) ──
  const stamp = Date.now();
  const ident = 'cypress-wiz-' + stamp;
  const email = ident + '@test.local';
  const hashed = await bcrypt.hash('Test123!', 10);
  const ins = await db.query(
    "INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt) VALUES (?,?,?,?,?,'apprenant','0000000000',0,?,NOW(),NOW())",
    { replacements: [`Cypress${stamp}`, 'Wizard', ident, email, hashed, SITE_ID], type: db.QueryTypes.INSERT }
  );
  const userId = typeof ins[0] === 'number' ? ins[0] : (ins[0].insertId || ins[0][0]?.id);
  try {
    await db.query(
      "INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, periode, createdAt, updatedAt) VALUES (?, '2000-01-01','TestVille','M','TestNationalite',?,'CNI','matin', NOW(),NOW())",
      { replacements: [userId, 'CNI-' + stamp], type: db.QueryTypes.INSERT }
    );
  } catch (e) {
    await db.query(
      "INSERT INTO aut_apprenants (utilisateurId, createdAt, updatedAt) VALUES (?, NOW(), NOW())",
      { replacements: [userId], type: db.QueryTypes.INSERT }
    );
  }
  await ensureSite(userId);
  const apprenant = (
    await db.query(
      'SELECT id, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?',
      { replacements: [userId], type: db.QueryTypes.SELECT }
    )
  )[0];

  const tokens = {
    APPRENANT_TOKEN: buildToken(apprenant),
    CABINET_TOKEN: buildToken(cabinet),
    ESA_TOKEN: buildToken(esa),
    COMITE_TOKEN: buildToken(comite),
    SESSION_ID: String(SESSION_ID),
  };

  fs.writeFileSync('D:/EasyEcole/easy-ecole-web/cypress.env.json', JSON.stringify(tokens, null, 2));

  // ── Contrôle : l'apprenant voit-il la session ciblée ? ──
  const res = await fetch('http://localhost:3000/api/v1/inscription/sessions', {
    headers: { Authorization: 'Bearer ' + tokens.APPRENANT_TOKEN },
  });
  const json = await res.json().catch(() => null);
  const liste = json && json.data !== undefined ? json.data : json;
  const ids = Array.isArray(liste) ? liste.map((s) => s.id) : [];
  console.log('APPRENANT=' + apprenant.identifiant + ' (id=' + apprenant.id + ', site=' + apprenant.etablissementId + ')');
  console.log('GET /sessions status=' + res.status + ' count=' + ids.length + ' | contient ' + SESSION_ID + ' ? ' + ids.includes(SESSION_ID));
  const s = Array.isArray(liste) ? liste.find((x) => Number(x.id) === Number(SESSION_ID)) : null;
  if (s) {
    console.log('  session ' + s.id + ' site=' + s.etablissementId + ' pieces=' + (s.dossiersInscription || []).length +
      ' -> ' + (s.dossiersInscription || []).map((p) => p.id + ':' + p.titre).join(' || '));
  }
  console.log('WROTE easy-ecole-web/cypress.env.json');
  process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

/* Purge ciblée des DEMANDES d'inscription liées à un utilisateur.
 * Supprime les demandes + dépendances (parcours choisis, pré-inscriptions, réponses,
 * paiements, quitus, dossiers liés, cursus...). NE SUPPRIME PAS le compte utilisateur.
 *
 * Configuration BDD : variables d'environnement (comme l'app) :
 *   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME  (fallback = config locale dev)
 *
 * Usage : node tmp_supprimer_demandes_user.js <userId | email>
 *   -> demande une confirmation explicite ("OUI") avant de supprimer.
 */
const mysql = require('mysql2/promise');
const readline = require('readline');

// Charge le .env de l'app si présent (dotenv est une dépendance du projet)
try { require('dotenv').config(); } catch (_e) { /* dotenv absent : on passe par les variables système */ }

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
};

const CIBLE = process.argv[2];
if (!CIBLE) { console.error('Usage: node tmp_supprimer_demandes_user.js <userId | email>'); process.exit(1); }

function askConfirmation(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(message, (ans) => { rl.close(); resolve(ans.trim().toUpperCase()); }));
}

(async () => {
  const pool = mysql.createPool({ ...DB, connectionLimit: 5 });
  const c = await pool.getConnection();
  console.log(`Connexion BDD : ${DB.host}:${DB.port}/${DB.database}`);

  // Résolution du/des compte(s) cible(s)
  const isNumber = /^\d+$/.test(CIBLE);
  const [users] = isNumber
    ? await c.execute('SELECT id, nom, prenoms, email, identifiant, role FROM aut_utilisateurs WHERE id = ?', [CIBLE])
    : await c.execute('SELECT id, nom, prenoms, email, identifiant, role FROM aut_utilisateurs WHERE email = ?', [CIBLE]);

  if (users.length === 0) { console.log(`Aucun compte trouvé pour : ${CIBLE}`); await pool.end(); return; }
  console.log(`=== Comptes ciblés (${users.length}) ===`);
  users.forEach(u => console.log(`  id=${u.id} role=${u.role} identifiant=${u.identifiant} email=${u.email} nom=${u.nom} ${u.prenoms || ''}`));

  const userList = users.map(u => u.id).join(',') || 'NULL';

  // Demandes + matricules
  const [dems] = await c.execute(`SELECT id, matricule, utilisateurId, sessionId, statutPipeline FROM ins_demandes_inscription WHERE utilisateurId IN (${userList})`);
  console.log(`\n=== Demandes d'inscription (${dems.length}) ===`);
  dems.forEach(r => console.log(`  id=${r.id} matricule=${r.matricule} sessionId=${r.sessionId} statut=${r.statutPipeline}`));

  if (dems.length === 0) { console.log('\nAUCUNE demande à supprimer. Rien à faire.'); await pool.end(); return; }

  const ans = await askConfirmation(`\nConfirmer la suppression de ${dems.length} demande(s) ? Tapez OUI pour continuer : `);
  if (ans !== 'OUI') { console.log('Annulé (pas de "OUI").'); await pool.end(); return; }

  const ids = dems.map(r => r.id).join(',');
  const mList = [...new Set(dems.map(r => r.matricule).filter(Boolean))].map(m => `'${m}'`).join(',') || "'__none__'";
  const idList = (list) => (list.length ? list.join(',') : 'NULL');

  console.log(`\n=== SUPPRESSION EN TRANSACTION (demandeIds: ${ids.replace(/,/g, ', ')}) ===`);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const q = (sql, params = []) => conn.execute(sql, params).then(([rows]) => rows);

    // 1. Dossiers d'inscription liés
    const dd = await q(`SELECT dossierId FROM ins_dossiers_demandes WHERE demandeId IN (${ids})`);
    const dosInsIds = [...new Set(dd.map(r => r.dossierId))];
    if (dosInsIds.length) await q(`DELETE FROM ins_dossiers_demandes WHERE demandeId IN (${ids})`);
    if (dosInsIds.length) await q(`DELETE FROM ins_dossiers_inscription WHERE id IN (${idList(dosInsIds)})`);

    // 2. Enfants directs des demandes
    await q(`DELETE FROM ins_pre_inscriptions WHERE demandeInscriptionId IN (${ids})`);
    await q(`DELETE FROM ins_reponses_inscription WHERE demandeInscriptionId IN (${ids})`);
    await q(`DELETE FROM ins_cours_choisis WHERE demandeInscriptionId IN (${ids})`);
    await q(`DELETE FROM ins_prerequis_parcours_choisis WHERE parcoursChoisiId IN (SELECT id FROM ins_parcours_choisis WHERE demandeInscriptionId IN (${ids}))`);
    await q(`DELETE FROM ins_parcours_choisis WHERE demandeInscriptionId IN (${ids})`);

    // 3. Paiements (utilisateur OU matricule) + quitus + échéances/bordereaux
    await q(`DELETE FROM ins_quitus WHERE paiementInscriptionId IN (SELECT id FROM ins_paiements_inscription WHERE utilisateurId IN (${userList}))`);
    // Enfants des bordereaux de l'utilisateur (avant suppression des bordereaux)
    await q(`DELETE FROM ins_quitus WHERE bordereauId IN (SELECT id FROM ins_bordereaux WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM cpt_bordereau_echeance WHERE bordereauId IN (SELECT id FROM ins_bordereaux WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM cpt_portefeuille_credit WHERE bordereauId IN (SELECT id FROM ins_bordereaux WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_rattrapages_inscriptions WHERE bordereauId IN (SELECT id FROM ins_bordereaux WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_rattrapages_inscriptions WHERE paiementId IN (SELECT id FROM ins_bordereaux WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_bordereaux WHERE utilisateurId IN (${userList})`);
    await q(`DELETE FROM ins_echeances WHERE dossierEtudiantId IN (SELECT id FROM ins_dossiers_etudiants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_paiements_inscription WHERE utilisateurId IN (${userList}) OR matriculeInscription IN (${mList})`);

    // 4. Cursus / cours participants
    await q(`DELETE FROM ins_dispenses WHERE cursusApprenantId IN (SELECT id FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_equivalences WHERE cursusApprenantId IN (SELECT id FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_cours_participants WHERE utilisateurId IN (${userList})`);
    await q(`DELETE FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList})`);

    // 5. Dossiers étudiants
    await q(`DELETE FROM ins_dossiers_etudiants WHERE utilisateurId IN (${userList})`);

    // 6. Demandes elles-mêmes
    await q(`DELETE FROM ins_demandes_inscription WHERE id IN (${ids})`);

    await conn.commit();
    console.log(`  ✔ ${dems.length} demande(s) supprimée(s)${dosInsIds.length ? ` (+ ${dosInsIds.length} dossier(s) d'inscription)` : ''}.`);
  } catch (e) {
    await conn.rollback();
    console.error('  ✖ ROLLBACK — erreur:', e.message);
    process.exitCode = 1;
  } finally {
    conn.release();
  }

  const [check] = await pool.execute(`SELECT COUNT(*) AS n FROM ins_demandes_inscription WHERE id IN (${ids})`);
  console.log(`\nVérification : ${check[0].n} demande(s) restante(s) (attendu 0).`);
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
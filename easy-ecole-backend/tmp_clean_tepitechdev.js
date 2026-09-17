/* Purge ciblée des DEMANDES liées aux comptes "tepitechdev" (demandes d'inscription + dépendances).
 * Transaction complète. N'affecte PAS les comptes utilisateurs / apprenants (décision : à confirmer ensuite).
 * Usage : node tmp_clean_tepitechdev.js
 */
const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole', connectionLimit: 5 });
  const c = await pool.getConnection();

  const [users] = await c.execute(
    `SELECT id, nom, prenoms, email, identifiant, role FROM aut_utilisateurs
     WHERE email LIKE '%tepitechdev%' OR identifiant LIKE '%tepitechdev%' OR nom LIKE '%tepitechdev%'`
  );
  console.log(`=== Comptes "tepitechdev" (${users.length}) ===`);
  users.forEach(u => console.log(`  id=${u.id} role=${u.role} identifiant=${u.identifiant} email=${u.email} nom=${u.nom} ${u.prenoms || ''}`));

  // Demandes orphelines éventuelles de l'ancien compte supprimé id=69
  const [orphan69] = await c.execute(`SELECT id, matricule, utilisateurId FROM ins_demandes_inscription WHERE utilisateurId = 69`);
  if (orphan69.length) {
    console.log(`\n=== Demandes orphelines de l'utilisateur 69 (compte supprimé) (${orphan69.length}) ===`);
    orphan69.forEach(r => console.log(`  id=${r.id} matricule=${r.matricule}`));
  }

  const allDemandeIds = orphan69.map(r => r.id);
  const allMatricules = orphan69.map(r => r.matricule);

  for (const u of users) {
    const [dems] = await c.execute(`SELECT id, matricule, sessionId, statutPipeline FROM ins_demandes_inscription WHERE utilisateurId = ?`, [u.id]);
    console.log(`\n=== Demandes de l'utilisateur ${u.id} (${dems.length}) ===`);
    dems.forEach(r => console.log(`  id=${r.id} matricule=${r.matricule} sessionId=${r.sessionId} statut=${r.statutPipeline}`));
    allDemandeIds.push(...dems.map(r => r.id));
    allMatricules.push(...dems.map(r => r.matricule));
  }

  if (allDemandeIds.length === 0) {
    console.log('\nAUCUNE demande à supprimer. Rien à faire.');
    await c.end();
    return;
  }

  const ids = allDemandeIds.join(',');
  const idList = (list) => (list.length ? list.join(',') : 'NULL');
  const mList = allMatricules.length ? allMatricules.map(m => `'${m}'`).join(',') : "'__none__'";

  console.log(`\n=== SUPPRESSION EN TRANSACTION (demandeIds: ${allDemandeIds.join(', ')}) ===`);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const q = (sql, params = []) => conn.execute(sql, params).then(([rows]) => rows);

    // 1. Dossiers liés (ins_dossiers_demandes -> ins_dossiers_inscription)
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

    // 3. Paiements liés (utilisateur OU matricule) + quitus + échéances/bordereaux
    const userList = users.map(u => u.id).join(',') || 'NULL';
    await q(`DELETE FROM ins_quitus WHERE paiementInscriptionId IN (SELECT id FROM ins_paiements_inscription WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_bordereaux WHERE utilisateurId IN (${userList})`);
    await q(`DELETE FROM ins_echeances WHERE dossierEtudiantId IN (SELECT id FROM ins_dossiers_etudiants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_paiements_inscription WHERE utilisateurId IN (${userList}) OR matriculeInscription IN (${mList})`);

    // 4. Cursus / cours participants liés (sécurité, tables existantes)
    await q(`DELETE FROM ins_dispenses WHERE cursusApprenantId IN (SELECT id FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_equivalences WHERE cursusApprenantId IN (SELECT id FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList}))`);
    await q(`DELETE FROM ins_cours_participants WHERE utilisateurId IN (${userList})`);
    await q(`DELETE FROM ins_cursus_apprenants WHERE utilisateurId IN (${userList})`);

    // 5. Dossiers étudiants
    await q(`DELETE FROM ins_dossiers_etudiants WHERE utilisateurId IN (${userList})`);

    // 6. Enfin, les demandes elles-mêmes
    await q(`DELETE FROM ins_demandes_inscription WHERE id IN (${ids})`);

    await conn.commit();
    console.log(`  ✔ ${allDemandeIds.length} demande(s) supprimée(s)${dosInsIds.length ? ` (+ ${dosInsIds.length} dossier(s) d'inscription` : ''}${dosInsIds.length ? ')' : ''}.`);
  } catch (e) {
    await conn.rollback();
    console.error('  ✖ ROLLBACK — erreur:', e.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await c.end();
  }

  // Vérification post-suppression
  const [check] = await pool.execute(`SELECT COUNT(*) AS n FROM ins_demandes_inscription WHERE id IN (${ids})`);
  console.log(`\nVérification : ${check[0].n} demande(s) restante(s) (attendu 0).`);
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
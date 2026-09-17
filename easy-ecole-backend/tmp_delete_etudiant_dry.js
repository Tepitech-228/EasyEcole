/* DRY-RUN — Compte les enregistrements liés à l'étudiant tepitechdev@gmail.com
 * Aucune suppression. Affiche les effectifs table par table.
 * Usage : node tmp_delete_etudiant_dry.js
 */
const mysql = require('mysql2/promise');

const EMAIL = 'tepitechdev@gmail.com';

async function main() {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  const [u] = await c.execute(`SELECT id, nom, prenoms, email, role FROM aut_utilisateurs WHERE email = ?`, [EMAIL]);
  if (u.length === 0) {
    console.log(`AUCUN utilisateur trouvé avec l'email ${EMAIL}.`);
    await c.end();
    return;
  }
  const uid = u[0].id;
  console.log(`Utilisateur trouvé : id=${uid}, nom=${u[0].nom} ${u[0].prenoms}, role=${u[0].role}`);

  const [app] = await c.execute(`SELECT id FROM aut_apprenants WHERE utilisateurId = ?`, [uid]);
  const appId = app.length ? app[0].id : null;
  console.log(`Apprenant : ${appId ?? 'AUCUN'}`);

  const [dem] = await c.execute(`SELECT id, matricule FROM ins_demandes_inscription WHERE utilisateurId = ?`, [uid]);
  const demIds = dem.map(r => r.id);
  const matricules = dem.map(r => r.matricule);
  console.log(`Demandes d'inscription (${demIds.length}) : matricules = ${matricules.join(', ') || 'aucune'}`);

  const [dos] = await c.execute(`SELECT id FROM ins_dossiers_etudiants WHERE utilisateurId = ?`, [uid]);
  const dosIds = dos.map(r => r.id);
  console.log(`Dossiers étudiants (${dosIds.length}) : ids = ${dosIds.join(', ') || 'aucun'}`);

  const [cur] = await c.execute(
    `SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = ? OR demandeInscriptionId IN (${demIds.length ? demIds.join(',') : 'NULL'})`,
    [uid]
  );
  const curIds = cur.map(r => r.id);
  console.log(`Cursus apprenants (${curIds.length}) : ids = ${curIds.join(', ') || 'aucun'}`);

  const [dosIns] = await c.execute(
    `SELECT dossierId FROM ins_dossiers_demandes WHERE demandeId IN (${demIds.length ? demIds.join(',') : 'NULL'})`
  );
  const dosInsIds = [...new Set(dosIns.map(r => r.dossierId))];
  console.log(`Dossiers d'inscription (${dosInsIds.length}) : ids = ${dosInsIds.join(', ') || 'aucun'}`);

  // Utilitaires
  const count = async (table, whereSql, params) => {
    try {
      const [rows] = await c.execute(`SELECT COUNT(*) AS n FROM ${table} WHERE ${whereSql}`, params);
      return rows[0].n;
    } catch (e) {
      return `ERREUR: ${e.message.split('\n')[0]}`;
    }
  };

  const inList = (ids, col) => (ids.length ? `${col} IN (${ids.join(',')})` : '1=0');

  console.log('\n===== COMPTAGE PAR TABLE =====\n');

  const tables = [
    // Tables filles de l'apprenant
    ['aut_adresse_apprenants', `apprenantId = ?`, [appId]],
    ['aut_identite_apprenants', `apprenantId = ?`, [appId]],
    ['aut_informations_salarie_apprenants', `apprenantId = ?`, [appId]],
    ['aut_informations_parents_apprenants', `apprenantId = ?`, [appId]],
    ['aut_personne_prevenir_apprenants', `apprenantId = ?`, [appId]],
    // Pivots utilisateur
    ['aut_user_roles', `utilisateurId = ?`, [uid]],
    ['aut_user_permissions', `utilisateurId = ?`, [uid]],
    ['aut_parent_enfants', `parentUtilisateurId = ? OR enfantUtilisateurId = ?`, [uid, uid]],
    // Demandes d'inscription
    ['ins_parcours_choisis', inList(demIds, 'demandeInscriptionId'), []],
    ['ins_prerequis_parcours_choisis', inList(demIds, 'demandeInscriptionId'), []],
    ['ins_cours_choisis', inList(demIds, 'demandeInscriptionId'), []],
    ['ins_reponses_inscription', inList(demIds, 'demandeInscriptionId'), []],
    ['ins_pre_inscriptions', inList(demIds, 'demandeInscriptionId'), []],
    ['ins_dossiers_demandes', inList(demIds, 'demandeId'), []],
    ['ins_paiements_inscription', `utilisateurId = ? OR matriculeInscription IN (${matricules.map(m => `'${m}'`).join(',') || "'__none__'"})`, [uid]],
    ['ins_quitus', `paiementInscriptionId IN (SELECT id FROM ins_paiements_inscription WHERE utilisateurId = ?)`, [uid]],
    // Dossiers étudiants
    ['ins_echeances', inList(dosIds, 'dossierEtudiantId'), []],
    ['ins_bordereaux', `utilisateurId = ? OR echeanceId IN (SELECT id FROM ins_echeances WHERE dossierEtudiantId IN (${dosIds.length ? dosIds.join(',') : 'NULL'}))`, [uid]],
    // Cursus
    ['ins_equivalences', inList(curIds, 'cursusApprenantId'), []],
    ['ins_dispenses', inList(curIds, 'cursusApprenantId'), []],
    ['ins_registres_academiques', inList(curIds, 'cursusApprenantId'), []],
    ['ins_designation_memoire', inList(curIds, 'cursusApprenantId'), []],
    ['scol_demandes_reorientation', inList(curIds, 'cursusApprenantId'), []],
    ['scol_decisions_passage', inList(curIds, 'cursusApprenantId'), []],
    ['scol_sanctions_academiques', inList(curIds, 'cursusApprenantId'), []],
    ['scol_diplomes', inList(curIds, 'cursusApprenantId'), []],
    ['ins_cursus_apprenants', `utilisateurId = ? OR demandeInscriptionId IN (${demIds.length ? demIds.join(',') : 'NULL'})`, [uid]],
    ['ins_cours_participants', `utilisateurId = ? OR cursusApprenantId IN (${curIds.length ? curIds.join(',') : 'NULL'})`, [uid]],
    ['ins_pointages', `utilisateurId = ?`, [uid]],
    ['ins_rattrapages_inscriptions', `demandePar = ?`, [uid]],
    ['ins_notes_evaluation', `coursParticipantId IN (SELECT id FROM ins_cours_participants WHERE utilisateurId = ?)`, [uid]],
    ['ins_absences', `coursParticipantId IN (SELECT id FROM ins_cours_participants WHERE utilisateurId = ?)`, [uid]],
    // Scolarite
    ['scol_demandes_document', `etudiantId = ?`, [uid]],
    ['scol_recus_caisse', `demandeDocumentId IN (SELECT id FROM scol_demandes_document WHERE etudiantId = ?)`, [uid]],
    ['scol_reclamations', `etudiantId = ?`, [uid]],
    ['scol_demandes_vae', `utilisateurId = ?`, [uid]],
    // Tables génériques liées à l'utilisateur (rôles fonctionnels)
    ['scol_publication_notes', `publiePar = ?`, [uid]],
    ['scol_journal_secretariat', `utilisateurId = ?`, [uid]],
    ['ins_dossiers_inscription', inList(dosInsIds, 'id'), []],
  ];

  let total = 0;
  for (const [table, whereSql, params] of tables) {
    const n = await count(table, whereSql, params);
    const label = typeof n === 'number' ? String(n).padStart(4) : n;
    console.log(`${label}   ${table}`);
    if (typeof n === 'number') total += n;
  }

  console.log(`\nTOTAL enregistrements liés (hors utilisateur/apprenant) : ${total}`);
  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
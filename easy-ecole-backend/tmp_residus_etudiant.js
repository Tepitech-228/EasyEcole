/* Résidus spécifiques de l'étudiant supprimé :
 * utilisateur 69, apprenant 48, demandes (matricules 10898758 / 00125186), dossier d'inscription 14.
 * Lecture seule.
 */
const mysql = require('mysql2/promise');

const UID = 69, APPID = 48, DOSSIER_INS = 14;
const MATRICULES = ['10898758', '00125186'];

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const q = async (title, sql, params = []) => {
    const [rows] = await c.execute(sql, params);
    if (rows.length) {
      console.log(`--- ${title} (${rows.length}) ---`);
      rows.forEach(r => console.log('   ' + Object.values(r).join(' | ')));
    }
  };

  console.log('=== Résidus liés à utilisateurId=' + UID + ' ===');
  await q('ins_bordereaux', `SELECT id, numeroBordereau, montant, statut, utilisateurId, echeanceId, typeOperationId FROM ins_bordereaux WHERE utilisateurId = ?`, [UID]);
  await q('ins_demandes_inscription (id/matricule)', `SELECT id, matricule, sessionId, typeDemande, deletedAt FROM ins_demandes_inscription WHERE id = 0`); // placeholder
  await q('ins_rattrapages_inscriptions', `SELECT id, coursParticipantId, bordereauId FROM ins_rattrapages_inscriptions WHERE demandePar = ?`, [UID]);
  await q('ins_pointages', `SELECT id, utilisateurId FROM ins_pointages WHERE utilisateurId = ?`, [UID]);
  await q('ins_cours_participants', `SELECT id, utilisateurId, cursusApprenantId FROM ins_cours_participants WHERE utilisateurId = ?`, [UID]);
  await q('scol_demandes_document', `SELECT id, etudiantId FROM scol_demandes_document WHERE etudiantId = ?`, [UID]);
  await q('scol_reclamations', `SELECT id, etudiantId FROM scol_reclamations WHERE etudiantId = ?`, [UID]);
  await q('scol_demandes_vae', `SELECT id, utilisateurId FROM scol_demandes_vae WHERE utilisateurId = ?`, [UID]);
  await q('com_communications', `SELECT id, utilisateurId FROM com_communications WHERE utilisateurId = ?`, [UID]);

  console.log('\n=== Résidus liés à apprenantId=' + APPID + ' ===');
  await q('aut_adresses_apprenants', `SELECT id, apprenantId FROM aut_adresses_apprenants WHERE apprenantId = ?`, [APPID]);
  await q('aut_identites_apprenants', `SELECT id, apprenantId FROM aut_identites_apprenants WHERE apprenantId = ?`, [APPID]);
  await q('aut_informations_salarie_apprenants', `SELECT id, apprenantId FROM aut_informations_salarie_apprenants WHERE apprenantId = ?`, [APPID]);
  await q('aut_informations_parents_apprenants', `SELECT id, apprenantId FROM aut_informations_parents_apprenants WHERE apprenantId = ?`, [APPID]);
  await q('aut_personnes_prevenir_apprenants', `SELECT id, apprenantId FROM aut_personnes_prevenir_apprenants WHERE apprenantId = ?`, [APPID]);
  await q('par_parents_enfants', `SELECT id, apprenantId, parentUtilisateurId FROM par_parents_enfants WHERE apprenantId = ?`, [APPID]);
  await q('stg_demandes_stage', `SELECT id, apprenantId FROM stg_demandes_stage WHERE apprenantId = ?`, [APPID]);

  console.log('\n=== Résidus liés aux anciennes demandes (matricules) ===');
  await q('ins_paiements_inscription (matriculeInscription)', `SELECT id, utilisateurId, matriculeInscription, montant FROM ins_paiements_inscription WHERE matriculeInscription IN (?, ?)`, MATRICULES);

  console.log('\n=== Dossier d\'inscription #' + DOSSIER_INS + ' ===');
  await q('ins_dossiers_inscription', `SELECT id, titre, sessionId, deletedAt FROM ins_dossiers_inscription WHERE id = ?`, [DOSSIER_INS]);
  await q('ins_dossiers_demandes (lien vers #14)', `SELECT id, demandeId, dossierId FROM ins_dossiers_demandes WHERE dossierId = ?`, [DOSSIER_INS]);

  console.log('\n=== Liens vers des demandes supprimées (dossiers_demandes orphelins dem) ===');
  await q('ins_dossiers_demandes orphelins demandeId', `SELECT dd.id, dd.demandeId, dd.dossierId, d.id AS demExists FROM ins_dossiers_demandes dd LEFT JOIN ins_demandes_inscription d ON dd.demandeId = d.id WHERE d.id IS NULL`);

  await c.end();
  console.log('\nTerminé.');
})().catch(e => { console.error(e); process.exit(1); });
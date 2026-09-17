/* Analyse des ORPHELINS : lignes dont la FK pointe vers un parent supprimé.
 * Lecture seule. Usage : node tmp_orphans_scan.js
 */
const mysql = require('mysql2/promise');

// [table, fkColumn, referencedTable]
const CHECKS = [
  ['aut_adresses_apprenants', 'apprenantId', 'aut_apprenants'],
  ['aut_identites_apprenants', 'apprenantId', 'aut_apprenants'],
  ['aut_informations_salarie_apprenants', 'apprenantId', 'aut_apprenants'],
  ['aut_informations_parents_apprenants', 'apprenantId', 'aut_apprenants'],
  ['aut_personnes_prevenir_apprenants', 'apprenantId', 'aut_apprenants'],
  ['par_parents_enfants', 'apprenantId', 'aut_apprenants'],
  ['stg_demandes_stage', 'apprenantId', 'aut_apprenants'],
  ['ins_parcours_choisis', 'demandeInscriptionId', 'ins_demandes_inscription'],
  ['ins_prerequis_parcours_choisis', 'parcoursChoisiId', 'ins_parcours_choisis'],
  ['ins_cours_choisis', 'demandeInscriptionId', 'ins_demandes_inscription'],
  ['ins_reponses_inscription', 'demandeInscriptionId', 'ins_demandes_inscription'],
  ['ins_pre_inscriptions', 'demandeInscriptionId', 'ins_demandes_inscription'],
  ['ins_dossiers_demandes', 'demandeId', 'ins_demandes_inscription'],
  ['ins_dossiers_demandes', 'dossierId', 'ins_dossiers_inscription'],
  ['ins_paiements_inscription', 'utilisateurId', 'aut_utilisateurs'],
  ['ins_echeances', 'dossierEtudiantId', 'ins_dossiers_etudiants'],
  ['ins_bordereaux', 'utilisateurId', 'aut_utilisateurs'],
  ['ins_bordereaux', 'echeanceId', 'ins_echeances'],
  ['ins_quitus', 'paiementInscriptionId', 'ins_paiements_inscription'],
  ['ins_quitus', 'bordereauId', 'ins_bordereaux'],
  ['ins_cours_participants', 'utilisateurId', 'aut_utilisateurs'],
  ['ins_cours_participants', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_notes_evaluation', 'coursParticipantId', 'ins_cours_participants'],
  ['ins_absences', 'noteEvaluationId', 'ins_notes_evaluation'],
  ['ins_rattrapages_inscriptions', 'demandePar', 'aut_utilisateurs'],
  ['scol_demandes_document', 'etudiantId', 'aut_utilisateurs'],
  ['scol_reclamations', 'etudiantId', 'aut_utilisateurs'],
  ['scol_demandes_vae', 'utilisateurId', 'aut_utilisateurs'],
  ['elearning_certificats', 'apprenantId', 'aut_utilisateurs'],
  ['elearning_progression_apprenant', 'apprenantId', 'aut_utilisateurs'],
  ['elearning_reponses_quiz', 'apprenantId', 'aut_utilisateurs'],
  ['elearning_soumissions_devoirs', 'apprenantId', 'aut_utilisateurs'],
  ['ori_demandes_orientation', 'utilisateurId', 'aut_utilisateurs'],
  ['ori_panier_parcours_choisis', 'utilisateurId', 'aut_utilisateurs'],
  ['ori_reponses_orientation', 'utilisateurId', 'aut_utilisateurs'],
  ['com_suggestions', 'utilisateurId', 'aut_utilisateurs'],
  ['com_communications', 'utilisateurId', 'aut_utilisateurs'],
  ['com_reponses_suggestion', 'utilisateurId', 'aut_utilisateurs'],
  ['ins_bulletins', 'utilisateurId', 'aut_utilisateurs'],
  ['ins_bulletins', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_resultats_deliberation', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_dettes_academiques', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_designation_memoires', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['scol_registres_academiques', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['scol_decisions_passage', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['scol_sanctions_academiques', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['scol_diplomes', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_dispenses', 'cursusApprenantId', 'ins_cursus_apprenants'],
  ['ins_equivalences', 'cursusApprenantId', 'ins_cursus_apprenants'],
];

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  console.log('=== ORPHELINS (FK → parent inexistant) ===\n');
  for (const [table, col, ref] of CHECKS) {
    const sql = `SELECT COUNT(*) AS n FROM ${table} t LEFT JOIN ${ref} r ON t.${col} = r.id WHERE r.id IS NULL`;
    try {
      const [rows] = await c.execute(sql);
      const n = rows[0].n;
      if (n > 0) console.log(`${String(n).padStart(5)}   ${table}.${col} -> ${ref} (ORPHELINS)`);
    } catch (e) {
      console.log(`  ERR  ${table}.${col} -> ${ref}: ${e.message.split('\n')[0]}`);
    }
  }
  await c.end();
  console.log('\nScan terminé.');
})().catch(e => { console.error(e); process.exit(1); });
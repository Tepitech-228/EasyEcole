const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', database: 'easyecole' });
  const tables = [
    'ins_cours_participants','ins_equivalences','ins_dispenses','ins_designation_memoires',
    'ins_prerequis_parcours_choisis','ins_parcours_choisis','ins_cours_choisis',
    'ins_reponses_inscription','ins_pre_inscriptions','ins_demandes_inscription_dossiers',
    'ins_dossiers_demandes','scol_documents_delivres','scol_journal_caisse','scol_recus_caisse',
    'scol_demandes_document','ins_cursus_apprenants','ins_demandes_inscription',
    'ins_paiements_inscription','ins_bordereaux','ins_dossiers_etudiants','aut_apprenants',
    'aut_user_permissions','aut_user_roles','aut_utilisateurs'
  ];
  for (const t of tables) {
    const [r] = await c.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema='easyecole' AND table_name=?", [t]);
    console.log((r[0].n ? 'OK  ' : 'MISSING ') + t);
  }
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
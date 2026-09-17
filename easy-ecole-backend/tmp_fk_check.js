const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // Colonnes faisant référence à un dossier étudiant
  const [cols] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND (COLUMN_NAME LIKE '%dossierEtudiant%' OR COLUMN_NAME LIKE '%dossier_etudiant%' OR COLUMN_NAME LIKE '%dossierEtudiantId%')`
  );
  console.log('=== Colonnes dossierEtudiant ===');
  cols.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  // Autres colonnes plausibles (dossierId)
  const [cols2] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND COLUMN_NAME IN ('dossierEtudiantId','dossier_etudiant_id','dossierEtudiantsId')`
  );
  console.log('\n=== Colonnes variantes ===');
  cols2.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  // Tests directs de dépendances pour les 5 dossiers (17,20,22,23,24)
  const ids = [17, 20, 22, 23, 24].map(x => `'${x}'`).join(',');
  const [fkCheck] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA='easyecole' AND REFERENCED_TABLE_NAME='ins_dossiers_etudiants'`
  );
  console.log('\n=== FK pointant vers ins_dossiers_etudiants ===');
  fkCheck.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME} → ${r.REFERENCED_TABLE_NAME}`));
  if (!fkCheck.length) console.log('  (aucune FK déclarée — vérification par colonnes de rechange)');

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
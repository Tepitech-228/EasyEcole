const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const ids = [17, 20, 22, 23, 24].map(x => `'${x}'`).join(',');

  // 1. Détail des échéances
  const [ech] = await c.execute(`SELECT id, dossierEtudiantId, montant, statut, createdAt FROM ins_echeances WHERE dossierEtudiantId IN (${ids}) ORDER BY dossierEtudiantId`);
  console.log(`=== ins_echeances (${ech.length}) ===`);
  ech.forEach(r => console.log(`  id=${r.id} dossier=${r.dossierEtudiantId} montant=${r.montant} statut=${r.statut}`));

  // 2. Détail des portefeuilles
  const [pf] = await c.execute(`SELECT id, dossierEtudiantId, montant, createdAt FROM cpt_portefeuille_credit WHERE dossierEtudiantId IN (${ids})`);
  console.log(`\n=== cpt_portefeuille_credit (${pf.length}) ===`);
  pf.forEach(r => console.log(`  id=${r.id} dossier=${r.dossierEtudiantId} montant=${r.montant}`));

  // 3. Tables référençant ins_echeances
  const [fkEch] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA='easyecole' AND REFERENCED_TABLE_NAME='ins_echeances'`
  );
  console.log('\n=== FK vers ins_echeances ===');
  fkEch.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  // 4. Tables référençant cpt_portefeuille_credit
  const [fkPf] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA='easyecole' AND REFERENCED_TABLE_NAME='cpt_portefeuille_credit'`
  );
  console.log('\n=== FK vers cpt_portefeuille_credit ===');
  fkPf.forEach(r => console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
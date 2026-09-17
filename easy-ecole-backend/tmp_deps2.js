const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const echIds = [16,26,25,24,23,22,21,20,19,18,17,56,57,58,59,55,54,53,52,51,50,49,78,79,80,81,77,76,75,74,73,72,71,88,89,90,91,87,86,85,84,83,82,98,99,100,101,97,96,95,94,93,92,102];
  const echList = echIds.map(x => `'${x}'`).join(',');

  // 1. cpt_bordereau_echeance — colonnes ?
  const [be] = await c.execute(`SHOW COLUMNS FROM cpt_bordereau_echeance`);
  console.log('cpt_bordereau_echeance cols:', be.map(x=>x.Field).join(', '));
  const beCol = be.find(x=>/echeance|cotisation|frais/i.test(x.Field))?.Field || 'echeanceId';
  try {
    const [r] = await c.execute(`SELECT COUNT(*) AS n FROM cpt_bordereau_echeance WHERE \`${beCol}\` IN (${echList})`);
    console.log(`  lignes cpt_bordereau_echeance pour nos échéances: ${r[0].n}`);
  } catch(e){ console.log('  err', e.message.slice(0,100)); }

  // 2. cpt_portefeuille_credit.echeanceId
  try {
    const [r] = await c.execute(`SELECT id, echeanceId, dossierEtudiantId, montant FROM cpt_portefeuille_credit WHERE echeanceId IN (${echList})`);
    console.log(`  cpt_portefeuille_credit liées à nos échéances: ${r.length}`);
    r.forEach(x=>console.log(`    pf id=${x.id} eche=${x.echeanceId} dossier=${x.dossierEtudiantId} montant=${x.montant}`));
  } catch(e){ console.log('  err', e.message.slice(0,100)); }

  // 3. ins_bordereaux.echeanceId
  try {
    const [r] = await c.execute(`SELECT id, echeanceId FROM ins_bordereaux WHERE echeanceId IN (${echList})`);
    console.log(`  ins_bordereaux liés à nos échéances: ${r.length}`);
    r.forEach(x=>console.log(`    bord id=${x.id} eche=${x.echeanceId}`));
  } catch(e){ console.log('  err', e.message.slice(0,100)); }

  // 4. paiements liés à ces bordereaux / échéances (ins_paiements? cpt_?)
  const [payTables] = await c.execute(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND (COLUMN_NAME IN ('bordereauId','paiementId','echeanceId','portefeuilleCreditId','portefeuilleId'))`
  );
  console.log('\n=== Tables avec colonnes bordereauId/paiementId/echeanceId/portefeuille ===');
  payTables.forEach(r=>console.log(`  ${r.TABLE_NAME}.${r.COLUMN_NAME}`));

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
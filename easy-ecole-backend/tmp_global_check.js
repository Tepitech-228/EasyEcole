const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // Toutes les tables du schéma easyecole
  const [tables] = await c.execute(`SHOW TABLES`);
  const all = tables.map(r => Object.values(r)[0]);
  console.log(`Total tables : ${all.length}`);

  // Tables contenant utilisateurId
  const [cols] = await c.execute(
    `SELECT TABLE_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND COLUMN_NAME='utilisateurId'`
  );
  console.log('\n=== Tables avec utilisateurId (+ orphelins) ===');
  for (const r of cols) {
    const t = r.TABLE_NAME;
    try {
      const [rows] = await c.execute(
        `SELECT COUNT(*) AS n FROM \`${t}\` u LEFT JOIN aut_utilisateurs au ON u.utilisateurId = au.id WHERE au.id IS NULL`
      );
      if (rows[0].n > 0) console.log(`  ${t}: ${rows[0].n} orphelins`);
    } catch (e) { /* skip */ }
  }

  // Orphelins demandes: parcours_choisis déjà purgé — vérifier les autres tables liées à demandes
  const [dcols] = await c.execute(
    `SELECT TABLE_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA='easyecole' AND COLUMN_NAME='demandeInscriptionId'`
  );
  console.log('\n=== Tables liées à demandeInscriptionId (+ orphelins) ===');
  for (const r of dcols) {
    const t = r.TABLE_NAME;
    try {
      const [rows] = await c.execute(
        `SELECT COUNT(*) AS n FROM \`${t}\` d LEFT JOIN ins_demandes_inscription di ON d.demandeInscriptionId = di.id WHERE d.demandeInscriptionId IS NOT NULL AND di.id IS NULL`
      );
      if (rows[0].n > 0) console.log(`  ${t}: ${rows[0].n} orphelins`);
    } catch (e) { console.log(`  ${t}: erreur ${e.message.slice(0,60)}`); }
  }

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
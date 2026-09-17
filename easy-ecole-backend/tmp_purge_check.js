const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // Demandes restantes par session (vue d'ensemble)
  const [d] = await c.execute(
    `SELECT d.sessionId, COUNT(*) AS n FROM ins_demandes_inscription d GROUP BY d.sessionId ORDER BY d.sessionId`
  );
  console.log('=== Demandes restantes par session ===');
  d.forEach(r => console.log(`  sessionId=${r.sessionId}: ${r.n} demandes`));

  // Orphelins globaux restants (lignes flottantes)
  const [orphAdresses] = await c.execute(
    `SELECT COUNT(*) AS n FROM aut_adresses a LEFT JOIN aut_utilisateurs u ON a.utilisateurId = u.id WHERE u.id IS NULL`
  );
  const [orphIdentites] = await c.execute(
    `SELECT COUNT(*) AS n FROM aut_identites i LEFT JOIN aut_utilisateurs u ON i.utilisateurId = u.id WHERE u.id IS NULL`
  );
  const [orphParcours] = await c.execute(
    `SELECT COUNT(*) AS n FROM ins_parcours_choisis pc LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id WHERE d.id IS NULL`
  );
  console.log(`\n=== Orphelins globaux restants ===`);
  console.log(`  adresses sans utilisateur : ${orphAdresses[0].n}`);
  console.log(`  identités sans utilisateur : ${orphIdentites[0].n}`);
  console.log(`  parcours choisis sans demande : ${orphParcours[0].n}`);

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
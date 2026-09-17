const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [r1] = await c.execute(`DELETE FROM ins_parcours_choisis WHERE demandeInscriptionId = 55`);
  const [r2] = await c.execute(`DELETE FROM ins_demandes_inscription WHERE id = 55`);
  console.log(`Nettoyage demande 55 : parcours=${r1.affectedRows}, demande=${r2.affectedRows}`);

  // État final session 11
  const [d] = await c.execute(`SELECT id FROM ins_demandes_inscription WHERE sessionId = 11`);
  console.log(`Demandes restantes session 11 : ${d.length}`);
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
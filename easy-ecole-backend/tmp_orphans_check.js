const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const [orph] = await c.execute(
    `SELECT pc.id AS parcoursId, pc.demandeInscriptionId, pc.deletedAt, pc.parcoursId AS refParcoursId
     FROM ins_parcours_choisis pc
     LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id
     WHERE d.id IS NULL`
  );
  console.log('=== Parcours choisis orphelins ===');
  orph.forEach(r => console.log(`  parcoursChoisiId=${r.parcoursId} → demandeInscriptionId=${r.demandeInscriptionId} (introuvable) refParcours=${r.refParcoursId} deletedAt=${r.deletedAt || 'non'}`));
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
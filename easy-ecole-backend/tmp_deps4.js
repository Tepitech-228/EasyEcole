const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const mats = ['18-ECO5J-26-ST','20-INF2J-26-ST','22-INF9J-26-ST','23-LIC8J-26-ST','24-LIC5J-27-ST'];
  const list = mats.map(m=>`'${m}'`).join(',');
  const [p] = await c.execute(`SELECT id, numero, matriculeInscription, montant, description, deletedAt FROM ins_paiements_inscription WHERE matriculeInscription IN (${list})`);
  console.log(`=== ins_paiements_inscription pour nos matricules (${p.length}) ===`);
  p.forEach(r=>console.log(`  id=${r.id} num=${r.numero} mat=${r.matriculeInscription} montant=${r.montant} desc=${r.description||''} ${r.deletedAt?'DELETED':'actif'}`));

  // paiements liés aux utilisateurs 70/71/72 ou supprimés ? (non nécessaire, hors périmètre)
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
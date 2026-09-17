const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // 1. Supprimer la demande 54
  await c.beginTransaction();
  try {
    const [r1] = await c.execute(`DELETE FROM ins_parcours_choisis WHERE demandeInscriptionId = 54`);
    const [r2] = await c.execute(`DELETE FROM ins_demandes_inscription WHERE id = 54`);
    await c.commit();
    console.log(`Demande 54 supprimée : parcours_liés=${r1.affectedRows}, demande=${r2.affectedRows}`);
  } catch (e) { await c.rollback(); console.error('Erreur suppression:', e.message); process.exit(1); }

  // 2. Contraintes FK de ins_parcours_choisis
  const [ddl] = await c.execute(`SHOW CREATE TABLE ins_parcours_choisis`);
  console.log('\n=== SHOW CREATE TABLE ins_parcours_choisis ===');
  console.log(ddl[0]['Create Table']);

  // 3. Contraintes de ins_demandes_inscription
  const [ddlD] = await c.execute(`SHOW CREATE TABLE ins_demandes_inscription`);
  console.log('\n=== SHOW CREATE TABLE ins_demandes_inscription ===');
  console.log(ddlD[0]['Create Table']);

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
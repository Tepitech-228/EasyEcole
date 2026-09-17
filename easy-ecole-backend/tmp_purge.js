const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  await c.beginTransaction();
  const log = [];
  try {
    // 1. Parcours choisis orphelins (aucune demande rattachée)
    const [pcIds] = await c.execute(
      `SELECT pc.id FROM ins_parcours_choisis pc
       LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id
       WHERE pc.demandeInscriptionId IS NULL OR d.id IS NULL`
    );
    const ids = pcIds.map(r => r.id);
    if (ids.length) {
      const [delPc] = await c.execute(`DELETE FROM ins_parcours_choisis WHERE id IN (${ids.join(',')})`);
      log.push(`parcours_choisis orphelins supprimés : ${delPc.affectedRows} (ids ${ids.join(',')})`);
    }

    // 2. Demandes de test 50, 51, 52
    if (await c.execute(`SELECT id FROM ins_demandes_inscription WHERE id IN (50,51,52) LIMIT 1`)) {
      const [delD] = await c.execute(`DELETE FROM ins_demandes_inscription WHERE id IN (50,51,52)`);
      log.push(`demandes_inscription supprimées : ${delD.affectedRows} (ids 50,51,52)`);
    }

    await c.commit();
    console.log('PURGE OK');
    log.forEach(l => console.log('  ' + l));

    // 3. Contrôle post-purge
    const [restD] = await c.execute(`SELECT COUNT(*) AS n FROM ins_demandes_inscription WHERE id IN (50,51,52)`);
    const [restPc] = await c.execute(
      `SELECT COUNT(*) AS n FROM ins_parcours_choisis pc
       LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id
       WHERE pc.demandeInscriptionId IS NULL OR d.id IS NULL`
    );
    console.log(`Contrôle : demandes 50-52 restantes=${restD[0].n}, parcours orphelins restants=${restPc[0].n}`);
  } catch (e) {
    await c.rollback();
    console.error('PURGE ANNULÉE (rollback):', e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})().catch(e => { console.error(e); process.exit(1); });
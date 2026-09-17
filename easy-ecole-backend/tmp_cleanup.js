const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  // Supprimer les artefacts créés par tmp_repro.js : parcours id=81, demande id=53 (user 71, session 3)
  const [p] = await c.execute(`DELETE FROM ins_parcours_choisis WHERE id = 81`);
  const [d] = await c.execute(`DELETE FROM ins_demandes_inscription WHERE id = 53`);
  // Confirmer : vérifier qu'aucune parcours_choisis ne référence une demande supprimée récemment
  const [orph] = await c.execute(
    `SELECT pc.id, pc.demandeInscriptionId FROM ins_parcours_choisis pc
     LEFT JOIN ins_demandes_inscription d ON pc.demandeInscriptionId = d.id
     WHERE d.id IS NULL`
  );
  console.log('parcours supprimés:', p.affectedRows, '| demandes supprimées:', d.affectedRows);
  console.log('parcours orphelins:', orph.length);
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
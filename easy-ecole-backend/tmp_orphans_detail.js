const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  const [de] = await c.execute(
    `SELECT d.id, d.utilisateurId, d.matricule, d.dateCreation, d.createdAt, d.deletedAt FROM ins_dossiers_etudiants d
     LEFT JOIN aut_utilisateurs au ON d.utilisateurId = au.id WHERE au.id IS NULL`
  );
  console.log('=== ins_dossiers_etudiants orphelins (' + de.length + ') ===');
  de.forEach(r => console.log(`  id=${r.id} userId=${r.utilisateurId} mat=${r.matricule} dateCreation=${r.dateCreation?.toISOString?.() ?? r.dateCreation} deleted=${r.deletedAt ? 'OUI' : 'non'}`));

  const [com] = await c.execute(
    `SELECT c.id, c.utilisateurId, c.titre, c.createdAt FROM com_communications c
     LEFT JOIN aut_utilisateurs au ON c.utilisateurId = au.id WHERE au.id IS NULL`
  );
  console.log('\n=== com_communications orphelines (' + com.length + ') ===');
  com.forEach(r => console.log(`  id=${r.id} userId=${r.utilisateurId} titre=${r.titre || ''} créé=${r.createdAt?.toISOString?.() ?? r.createdAt}`));

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
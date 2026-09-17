const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  // 1. Vérifier si l'utilisateur id=69 existe encore (soft delete ou non)
  const [u69] = await c.execute(`SELECT id, email, nom, role, deletedAt FROM aut_utilisateurs WHERE id = 69`);
  console.log('=== aut_utilisateurs id=69 ===');
  if (u69.length === 0) console.log('  → SUPPRIME (n existe plus)');
  else console.log(`  id=${u69[0].id} email=${u69[0].email} deletedAt=${u69[0].deletedAt || 'ACTIF'}`);

  // 2. Toutes les demandes pour la session id=11 (09/09/2026) — y compris supprimées
  const [d11] = await c.execute(
    `SELECT d.id, d.matricule, d.utilisateurId, d.typeDemande, d.statutPipeline, d.deletedAt
     FROM ins_demandes_inscription d
     WHERE d.sessionId = 11`
  );
  console.log(`\n=== ins_demandes_inscription (sessionId=11, session du 09/09/2026) — ${d11.length} résultat(s) ===`);
  d11.forEach(r => console.log(`  id=${r.id} matricule=${r.matricule} utilisateurId=${r.utilisateurId} type=${r.typeDemande} statut=${r.statutPipeline} deletedAt=${r.deletedAt || 'ACTIF'}`));

  // 3. Chercher des demandes dont le matricule correspond à tepitechdev (10898758 ou 00125186)
  const [dt] = await c.execute(
    `SELECT d.id, d.matricule, d.utilisateurId, d.sessionId, d.typeDemande, d.statutPipeline, d.deletedAt
     FROM ins_demandes_inscription d
     WHERE d.matricule IN ('10898758', '00125186')`
  );
  console.log(`\n=== Demandes avec matricule tepitechdev (10898758 / 00125186) — ${dt.length} résultat(s) ===`);
  dt.forEach(r => console.log(`  id=${r.id} matricule=${r.matricule} utilisateurId=${r.utilisateurId} sessionId=${r.sessionId} type=${r.typeDemande} deletedAt=${r.deletedAt || 'ACTIF'}`));

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
const mysql = require('mysql2/promise');
(async () => {
  const p = mysql.createPool({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole', connectionLimit: 3 });
  const rows = async (sql, params) => (await p.execute(sql, params || []))[0];
  console.log('Demandes restantes user 78 :', (await rows('SELECT COUNT(*) n FROM ins_demandes_inscription WHERE utilisateurId=78'))[0].n);
  console.log('Demandes restantes matricule 87087984 :', (await rows("SELECT COUNT(*) n FROM ins_demandes_inscription WHERE matricule='87087984'"))[0].n);
  console.log('Paiements restants matricule 87087984 :', (await rows("SELECT COUNT(*) n FROM ins_paiements_inscription WHERE matriculeInscription='87087984'"))[0].n);
  console.log('Parcours choisis demande 64 :', (await rows('SELECT COUNT(*) n FROM ins_parcours_choisis WHERE demandeInscriptionId=64'))[0].n);
  console.log('Pre-inscriptions demande 64 :', (await rows('SELECT COUNT(*) n FROM ins_pre_inscriptions WHERE demandeInscriptionId=64'))[0].n);
  console.log('Compte 78 toujours present :', (await rows('SELECT COUNT(*) n FROM aut_utilisateurs WHERE id=78'))[0].n);
  console.log('Apprenant 57 toujours present :', (await rows('SELECT COUNT(*) n FROM aut_apprenants WHERE id=57'))[0].n);
  const [autres] = await p.execute("SELECT COUNT(*) n FROM ins_demandes_inscription WHERE utilisateurId IN (SELECT id FROM aut_utilisateurs WHERE email LIKE '%tepitechdev%' OR identifiant LIKE '%tepitechdev%')");
  console.log('Demandes pour TOUS comptes tepitechdev :', autres[0].n);
  await p.end();
})().catch(e => { console.error(e); process.exit(1); });
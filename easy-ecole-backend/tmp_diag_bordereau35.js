// Diagnostic bordereau 35 — "Tous les documents requis doivent être téléversés"
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  const [b] = await c.execute(`SELECT * FROM ins_bordereaux WHERE id = 35`);
  if (!b.length) { console.log('Bordereau 35 introuvable'); return; }
  console.log('=== BORDEREAU 35 ===');
  console.log(JSON.stringify(b[0], null, 2));

  const userId = b[0].utilisateurId;

  // Demandes de l'utilisateur
  const [d] = await c.execute(
    `SELECT id, sessionId, utilisateurId, statutPipeline, typeDemande, createdAt, deletedAt
     FROM ins_demandes_inscription WHERE utilisateurId = ? ORDER BY createdAt DESC`, [userId]
  );
  console.log('\n=== DEMANDES user ' + userId + ' ===');
  d.forEach(r => console.log(`  id=${r.id} sess=${r.sessionId} pipeline=${r.statutPipeline} createdAt=${r.createdAt} ${r.deletedAt ? 'SOFT-DELETED' : 'ACTIVE'}`));

  for (const demande of d.filter(x => !x.deletedAt)) {
    console.log(`\n──────── DEMANDE ${demande.id} (session ${demande.sessionId}) ────────`);

    // Requis par session (dsi.sessionId == demande.sessionId dans le modèle ?)
    const [requis] = await c.execute(
      `SELECT id, titre FROM ins_dossiers_inscription WHERE sessionId = ? AND deletedAt IS NULL ORDER BY id`, [demande.sessionId]
    );
    console.log(`Documents REQUIS (dsi.sessionId=${demande.sessionId}) : ${requis.length}`);
    requis.forEach(r => console.log(`   [${r.id}] ${r.titre}`));

    // Téléversés sur la demande
    const [upl] = await c.execute(
      `SELECT dossierId, nomFichier FROM ins_dossiers_demandes WHERE demandeId = ? AND deletedAt IS NULL ORDER BY dossierId`, [demande.id]
    );
    console.log(`Documents TÉLÉVERSÉS (demande ${demande.id}) : ${upl.length}`);
    upl.forEach(r => console.log(`   [${r.dossierId}] ${r.nomFichier}`));

    // Parcours choisis
    const [pc] = await c.execute(`SELECT id, parcoursId, choixFinal FROM ins_parcours_choisis WHERE demandeInscriptionId = ?`, [demande.id]);
    console.log(`Parcours choisis : ${pc.length}`);
    pc.forEach(r => console.log(`   id=${r.id} parcoursId=${r.parcoursId} choixFinal=${r.choixFinal}`));

    // Préinscription
    const [pi] = await c.execute(`SELECT id, statut FROM ins_pre_inscriptions WHERE demandeInscriptionId = ?`, [demande.id]);
    console.log(`Préinscriptions : ${pi.length}`);
    pi.forEach(r => console.log(`   id=${r.id} statut=${r.statut}`));

    // Aussi : qu'est-ce que le modèle attend comme association dossiersInscription de la session ?
    const [sessionRows] = await c.execute(`SELECT * FROM ins_sessions WHERE id = ?`, [demande.sessionId]);
    console.log(`Session ${demande.sessionId}: niveauEtudeId=${sessionRows[0]?.niveauEtudeId}, anneeAcademiqueId=${sessionRows[0]?.anneeAcademiqueId}`);

    const [requisNiveau] = await c.execute(
      `SELECT id, titre, niveauEtudeId FROM ins_document_requis_niveau WHERE niveauEtudeId = ?`, [sessionRows[0]?.niveauEtudeId]
    );
    console.log(`Docs requis par NIVEAU (table ins_document_requis_niveau, niveauEtudeId=${sessionRows[0]?.niveauEtudeId}) : ${requisNiveau.length}`);
    requisNiveau.forEach(r => console.log(`   [${r.id}] ${r.titre}`));

    const requisIds = new Set(requis.map(r => r.id));
    const uplIds = new Set(upl.map(r => r.dossierId));
    const manquants = [...requisIds].filter(id => !uplIds.has(id));
    if (manquants.length) {
      console.log(`  MANQUANTS (requis non téléversés) : ${manquants.join(', ')}`);
    }
  }

  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
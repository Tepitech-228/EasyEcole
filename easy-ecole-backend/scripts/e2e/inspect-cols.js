const m = require('mysql2/promise');

async function main() {
  const db = await m.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  
  const tables = [
    'ins_dossiers_inscription',
    'ins_parcours_choisis',
    'ins_comite_votes',
    'ins_cursus_apprenants',
    'ins_rattrapages_inscriptions',
    'ins_rattrapage_comite_votes',
    'ins_rattrapage_planning',
    'ins_rattrapage_enseignants',
    'ins_rattrapage_notes',
    'ins_cours_participants',
    'ins_listes_notes_evaluation',
    'ins_notes_evaluation',
    'ins_bulletins',
    'ins_demandes_inscription',
    'ins_etapes_inscription',
    'ins_sessions_rattrapage',
    'ins_sessions_rattrapage_classes'
  ];
  
  for (const t of tables) {
    const [cols] = await db.query(`SHOW COLUMNS FROM ${t}`);
    console.log(`\n=== ${t} ===`);
    cols.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'NO' ? 'NOT NULL' : 'NULL'} default=${c.Default || 'NULL'}`));
  }
  
  await db.end();
}

main().catch(console.error);
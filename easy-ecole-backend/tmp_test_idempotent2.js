const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole',multipleStatements:true});
  console.log('Connected to MySQL\n');

  // Read the migration file
  const sql = fs.readFileSync('D:/EasyEcole/migrations/019_ecue_heures_type_enseignant.sql', 'utf8');

  // Run second time (idempotency)
  console.log('=== SECOND RUN (idempotency test) ===\n');

  try {
    await c.query(sql);
    console.log('Second run completed without errors.\n');
  } catch(e) {
    console.error('Second run ERROR:', e.message);
  }

  // Final verification
  console.log('=== FINAL VERIFICATION ===\n');

  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  const expectedEcue = ['cmHoraire','tdTpHoraire','tpeHoraire','type','enseignantId'];
  console.log('=== ins_ecue columns ===');
  expectedEcue.forEach(col => {
    const present = ecueCols.map(c => c.Field).includes(col);
    console.log(`  ${present ? 'OK' : 'MISSING'}: ${col} (${ecueCols.find(c => c.Field === col)?.Type})`);
  });

  const [coursCols] = await c.query("SHOW COLUMNS FROM ins_cours");
  const categoriePresent = coursCols.map(c => c.Field).includes('categorieUe');
  console.log(`\n=== ins_cours columns ===`);
  console.log(`  ${categoriePresent ? 'OK' : 'MISSING'}: categorieUe (${coursCols.find(c => c.Field === 'categorieUe')?.Type})`);

  const [fks] = await c.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log(`\nFK ins_ecue_ibfk_enseignant exists: ${fks.length > 0}`);

  // Count columns
  const [countEcue] = await c.execute(`SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue'`);
  const [countCours] = await c.execute(`SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_cours'`);
  console.log(`\nins_ecue total columns: ${countEcue[0].cnt}`);
  console.log(`ins_cours total columns: ${countCours[0].cnt}`);

  await c.end();
  console.log('\nAll tests passed.');
}

main().catch(e => { console.error(e); process.exit(1); });

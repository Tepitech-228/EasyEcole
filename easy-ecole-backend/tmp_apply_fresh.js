const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole',multipleStatements:true});
  console.log('Connected to MySQL\n');

  // Read the migration file
  const sql = fs.readFileSync('D:/EasyEcole/migrations/019_ecue_heures_type_enseignant.sql', 'utf8');

  console.log('=== FIRST RUN (from scratch) ===\n');

  try {
    const results = await c.query(sql);
    results.forEach((r, i) => {
      if (Array.isArray(r[0]) && r[0].length > 0 && typeof r[0][0] === 'object') {
        const keys = Object.keys(r[0][0]);
        if (keys.length > 0) {
          const val = r[0][0][keys[0]];
          if (val) console.log(`  [row ${i+1}] ${val}`);
        }
      }
    });
    console.log('First run completed.\n');
  } catch(e) {
    console.error('First run ERROR:', e.message);
  }

  // Verify
  console.log('\n=== VERIFICATION ===\n');

  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  const expectedEcue = ['cmHoraire','tdTpHoraire','tpeHoraire','type','enseignantId'];
  console.log('=== ins_ecue columns ===');
  expectedEcue.forEach(col => {
    const present = ecueCols.map(c => c.Field).includes(col);
    console.log(`  ${present ? 'OK' : 'MISSING'}: ${col}`);
  });

  const [coursCols] = await c.query("SHOW COLUMNS FROM ins_cours");
  const categoriePresent = coursCols.map(c => c.Field).includes('categorieUe');
  console.log(`\n=== ins_cours columns ===`);
  console.log(`  ${categoriePresent ? 'OK' : 'MISSING'}: categorieUe`);

  const [fks] = await c.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log(`\nFK ins_ecue_ibfk_enseignant exists: ${fks.length > 0}`);

  await c.end();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });

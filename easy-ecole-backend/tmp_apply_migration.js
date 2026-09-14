const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const c = await mysql.createConnection({
    host:'localhost', port:3307, user:'root', password:'', database:'easyecole',
    multipleStatements: true
  });
  console.log('Connected to MySQL\n');

  // Read the migration file
  const sql = fs.readFileSync('D:/EasyEcole/migrations/019_ecue_heures_type_enseignant.sql', 'utf8');

  // Execute the entire file as multiple statements
  try {
    const results = await c.query(sql);
    // Results is an array of [rows, fields] pairs
    console.log('Migration executed.\n');

    // Print any SELECT results
    results.forEach((r, i) => {
      if (Array.isArray(r[0]) && r[0].length > 0 && typeof r[0][0] === 'object') {
        const keys = Object.keys(r[0][0]);
        if (keys.length > 0) {
          const val = r[0][0][keys[0]];
          if (val) console.log(`  [row ${i+1}] ${val}`);
        }
      }
    });
  } catch(e) {
    console.error('Migration ERROR:', e.message);
    // Try to execute statement by statement for better error reporting
    console.log('\nTrying statement-by-statement...\n');
  }

  await c.end();

  // Now verify
  const c2 = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});

  console.log('\n=== VERIFICATION ===\n');

  // Verify ins_ecue columns
  const [ecueCols] = await c2.query("SHOW COLUMNS FROM ins_ecue");
  const expectedEcue = ['cmHoraire','tdTpHoraire','tpeHoraire','type','enseignantId'];
  const ecueFieldNames = ecueCols.map(c => c.Field);
  console.log('=== ins_ecue columns ===');
  let allEcueOk = true;
  expectedEcue.forEach(col => {
    const present = ecueFieldNames.includes(col);
    if (!present) allEcueOk = false;
    console.log(`  ${present ? 'OK' : 'MISSING'}: ${col}`);
  });
  console.log(`  All ins_ecue columns present: ${allEcueOk}`);

  // Verify ins_cours columns
  const [coursCols] = await c2.query("SHOW COLUMNS FROM ins_cours");
  const coursFieldNames = coursCols.map(c => c.Field);
  console.log('\n=== ins_cours columns ===');
  const categoriePresent = coursFieldNames.includes('categorieUe');
  console.log(`  ${categoriePresent ? 'OK' : 'MISSING'}: categorieUe`);

  // Verify FK
  const [fks] = await c2.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log(`\nFK ins_ecue_ibfk_enseignant exists: ${fks.length > 0}`);

  await c2.end();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });

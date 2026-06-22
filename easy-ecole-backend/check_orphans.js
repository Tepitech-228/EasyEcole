const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'easyecole'
  });

  // 1. Check current FK structure
  const [fk] = await conn.query("SHOW CREATE TABLE ins_chapitres_cours");
  console.log('=== CREATE TABLE ===');
  console.log(fk[0]['Create Table']);

  // 2. Find orphaned rows
  const [orphans] = await conn.query(
    `SELECT cc.id, cc.titre, cc.coursId 
     FROM ins_chapitres_cours cc 
     LEFT JOIN ins_cours c ON c.id = cc.coursId 
     WHERE c.id IS NULL`
  );
  console.log('\n=== ORPHANED ROWS in ins_chapitres_cours ===');
  console.log(`Count: ${orphans.length}`);
  console.table(orphans);

  // 3. Total counts
  const [totalCC] = await conn.query('SELECT COUNT(*) as total FROM ins_chapitres_cours');
  const [totalC] = await conn.query('SELECT COUNT(*) as total FROM ins_cours');
  console.log(`\nins_chapitres_cours total: ${totalCC[0].total}`);
  console.log(`ins_cours total: ${totalC[0].total}`);

  // 4. Check if FK constraint already exists
  const [constraints] = await conn.query(
    `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_NAME = 'ins_chapitres_cours' AND TABLE_SCHEMA = 'easyecole'
     AND REFERENCED_TABLE_NAME IS NOT NULL`
  );
  console.log('\n=== EXISTING FK CONSTRAINTS on ins_chapitres_cours ===');
  console.table(constraints);

  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });

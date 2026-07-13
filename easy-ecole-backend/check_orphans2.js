const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'easyecole'
  });

  const [coursIds] = await conn.query('SELECT id, code, intitule FROM ins_cours ORDER BY id');
  console.log('=== COURS IDs in ins_cours ===');
  console.table(coursIds);
  console.log(`Count: ${coursIds.length}`);
  
  const [chapitreIds] = await conn.query('SELECT DISTINCT coursId FROM ins_chapitres_cours ORDER BY coursId');
  console.log('\n=== DISTINCT coursId in ins_chapitres_cours ===');
  console.log(chapitreIds.map(r => r.coursId).join(', '));

  await conn.end();
}
main().catch(console.error);

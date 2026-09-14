const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  console.log('Connected to MySQL\n');

  // Try to drop the index using DROP INDEX syntax
  try {
    await c.execute(`DROP INDEX \`ins_ecue_ibfk_enseignant\` ON \`ins_ecue\``);
    console.log('Dropped index via DROP INDEX');
  } catch(e) {
    console.log('Index drop error:', e.message.substring(0, 200));
  }

  // Verify the index is gone
  const [idx] = await c.execute(`SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND INDEX_NAME='ins_ecue_ibfk_enseignant'`);
  console.log('Index still exists:', idx.length > 0);

  // Now try to drop the column
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP COLUMN \`enseignantId\``);
    console.log('Dropped enseignantId column');
  } catch(e) {
    console.log('Column drop error:', e.message.substring(0, 200));
  }

  // Final check
  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  console.log('\nins_ecue columns:', ecueCols.map(c => c.Field).join(', '));

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });

const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  console.log('Connected to MySQL\n');

  // Drop the FK constraint (whatever name) on enseignantId
  for (const name of ['ins_ecue_ibfk_34', 'ins_ecue_ibfk_enseignant']) {
    try {
      await c.execute(`ALTER TABLE \`ins_ecue\` DROP FOREIGN KEY \`${name}\``);
      console.log(`Dropped FK ${name}`);
    } catch(e) {
      console.log(`FK ${name} not present: ${e.message.substring(0, 80)}`);
    }
  }

  // Drop the index
  try {
    await c.execute(`DROP INDEX \`ins_ecue_ibfk_enseignant\` ON \`ins_ecue\``);
    console.log('Dropped index ins_ecue_ibfk_enseignant');
  } catch(e) {
    console.log('Index not present:', e.message.substring(0, 80));
  }

  // Now drop the enseignantId column
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP COLUMN \`enseignantId\``);
    console.log('Dropped enseignantId column');
  } catch(e) {
    console.log('enseignantId not present:', e.message.substring(0, 80));
  }

  // Verify clean state
  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  console.log('\nins_ecue columns:', ecueCols.map(c => c.Field).join(', '));
  const [fks] = await c.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log('FK exists:', fks.length > 0);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });

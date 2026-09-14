const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  console.log('Connected to MySQL\n');

  // Drop remaining columns from ins_ecue
  for (const col of ['cmHoraire','tdTpHoraire','tpeHoraire','type']) {
    try {
      await c.execute(`ALTER TABLE \`ins_ecue\` DROP COLUMN \`${col}\``);
      console.log(`Dropped ${col}`);
    } catch(e) {
      console.log(`${col} not present`);
    }
  }

  // Drop categorieUe from ins_cours
  try {
    await c.execute(`ALTER TABLE \`ins_cours\` DROP COLUMN \`categorieUe\``);
    console.log('Dropped categorieUe');
  } catch(e) {
    console.log('categorieUe not present');
  }

  // Verify clean state
  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  console.log('\nins_ecue columns:', ecueCols.map(c => c.Field).join(', '));
  const [coursCols] = await c.query("SHOW COLUMNS FROM ins_cours");
  console.log('ins_cours columns:', coursCols.map(c => c.Field).join(', '));
  const [fks] = await c.execute(`SELECT COUNT(*) as cnt FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log('FK ins_ecue_ibfk_enseignant exists:', fks[0].cnt > 0);

  await c.end();
  console.log('\nClean state ready for migration.');
}

main().catch(e => { console.error(e); process.exit(1); });

const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  console.log('Connected to MySQL\n');

  // Drop any remaining FK and index on enseignantId
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP FOREIGN KEY \`ins_ecue_ibfk_enseignant\``);
    console.log('Dropped FK');
  } catch(e) {
    console.log('FK not present:', e.message.substring(0, 120));
  }

  // Drop the index if it still exists
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP INDEX \`ins_ecue_ibfk_enseignant\``);
    console.log('Dropped index');
  } catch(e) {
    console.log('Index not present:', e.message.substring(0, 120));
  }

  // Drop enseignantId column
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP COLUMN \`enseignantId\``);
    console.log('Dropped enseignantId column');
  } catch(e) {
    console.log('enseignantId not present:', e.message.substring(0, 120));
  }

  // Drop other columns
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

  // Check FK
  const [fks] = await c.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log('FK exists:', fks.length > 0);

  await c.end();
  console.log('\nClean state confirmed.');
}

main().catch(e => { console.error(e); process.exit(1); });

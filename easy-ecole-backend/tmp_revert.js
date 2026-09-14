const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  console.log('Connected to MySQL\n');

  // 1. Drop FK constraint if exists
  try {
    await c.execute(`ALTER TABLE \`ins_ecue\` DROP FOREIGN KEY \`ins_ecue_ibfk_enseignant\``);
    console.log('Dropped FK ins_ecue_ibfk_enseignant');
  } catch(e) {
    console.log('FK not present (OK):', e.message.substring(0, 100));
  }

  // 2. Drop columns from ins_ecue
  const cols = ['cmHoraire','tdTpHoraire','tpeHoraire','type','enseignantId'];
  for (const col of cols) {
    try {
      await c.execute(`ALTER TABLE \`ins_ecue\` DROP COLUMN \`${col}\``);
      console.log(`Dropped column ${col} from ins_ecue`);
    } catch(e) {
      console.log(`Column ${col} not present (OK):`, e.message.substring(0, 100));
    }
  }

  // 3. Drop categorieUe from ins_cours
  try {
    await c.execute(`ALTER TABLE \`ins_cours\` DROP COLUMN \`categorieUe\``);
    console.log('Dropped column categorieUe from ins_cours');
  } catch(e) {
    console.log('categorieUe not present (OK):', e.message.substring(0, 100));
  }

  // 4. Verify clean state
  const [ecueCols] = await c.query("SHOW COLUMNS FROM ins_ecue");
  console.log('\nins_ecue columns after revert:', ecueCols.map(c => c.Field).join(', '));
  const [coursCols] = await c.query("SHOW COLUMNS FROM ins_cours");
  console.log('ins_cours columns after revert:', coursCols.map(c => c.Field).join(', '));

  await c.end();
  console.log('\nDatabase reverted to pre-migration state.');
}

main().catch(e => { console.error(e); process.exit(1); });

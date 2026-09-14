const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});

  // Try to add the FK directly
  try {
    const [res] = await c.execute(`
      ALTER TABLE \`ins_ecue\`
      ADD CONSTRAINT \`ins_ecue_ibfk_enseignant\`
      FOREIGN KEY (\`enseignantId\`) REFERENCES \`aut_enseignants\`(\`id\`) ON DELETE SET NULL
    `);
    console.log('FK added directly:', res);
  } catch(e) {
    console.error('Direct FK add error:', e.message);
  }

  // Check if it exists now
  const [fks] = await c.execute(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND CONSTRAINT_NAME='ins_ecue_ibfk_enseignant'`);
  console.log('FK exists after direct:', fks.length > 0);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });

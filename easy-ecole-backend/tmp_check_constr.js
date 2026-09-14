const mysql = require('mysql2/promise');

async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});

  // Check ALL constraints on ins_ecue
  const [constr] = await c.execute(`SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue'`);
  console.log('=== TABLE_CONSTRAINTS for ins_ecue ===');
  constr.forEach(r => console.log(`  ${r.CONSTRAINT_NAME}: ${r.CONSTRAINT_TYPE}`));

  // Check ALL keys on ins_ecue
  const [keys] = await c.execute(`SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue'`);
  console.log('\n=== STATISTICS for ins_ecue ===');
  keys.forEach(r => console.log(`  ${r.INDEX_NAME}: ${r.COLUMN_NAME} (unique=${!r.NON_UNIQUE})`));

  // Check KEY_COLUMN_USAGE for enseignants references
  const [fkUsage] = await c.execute(`SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_ecue' AND REFERENCED_TABLE_NAME IS NOT NULL`);
  console.log('\n=== KEY_COLUMN_USAGE (FK refs) ===');
  fkUsage.forEach(r => console.log(`  ${r.CONSTRAINT_NAME}: ${r.COLUMN_NAME} -> ${r.REFERENCED_TABLE_NAME}(${r.REFERENCED_COLUMN_NAME})`));

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });

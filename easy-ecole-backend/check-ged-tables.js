const { DatabaseConnection } = require('./lib/core/helpers/DatabaseConnection');
const db = DatabaseConnection.getInstance();
const sequelize = db.sequelize;

async function main() {
  await sequelize.authenticate();
  
  const [tables] = await sequelize.query("SHOW TABLES LIKE 'ged_%'");
  console.log('GED Tables:', tables.map(t => Object.values(t)[0]));

  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM ged_documents");
    console.log('\nged_documents columns:');
    cols.forEach(c => console.log('  ' + c.Field + ' (' + c.Type + ') ' + (c.Null === 'YES' ? 'NULL' : 'NOT NULL')));
  } catch(e) {
    console.log('ged_documents table error:', e.message);
  }

  await sequelize.close();
}
main().catch(e => { console.error(e); process.exit(1); });

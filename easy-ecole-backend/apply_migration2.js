require('dotenv').config()
async function run(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  try{
    await db.query("ALTER TABLE `ins_sessions` ADD COLUMN `statut` ENUM('ouverte','cloturee') NOT NULL DEFAULT 'ouverte' AFTER `description`")
    console.log('ALTER OK')
  }catch(e){ console.log('ALTER err', e.message) }
  const [cols]=await db.query("SHOW COLUMNS FROM ins_sessions")
  console.log(cols.map(c=>c.Field))
  process.exit(0)
}
run()
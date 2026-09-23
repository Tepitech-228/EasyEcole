require('dotenv').config()
async function run(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const fs=require('fs')
  const sql=fs.readFileSync('../migrations/024_session_statut.sql','utf8')
  // Split and execute each statement
  const statements = sql.split(';').map(s=>s.trim()).filter(s=>s && !s.startsWith('--'))
  for(const stmt of statements){
    if(stmt.startsWith('SET') || stmt.startsWith('PREPARE') || stmt.startsWith('EXECUTE') || stmt.startsWith('DEALLOCATE') || stmt.startsWith('ALTER') || stmt.startsWith('SELECT')){
      try{
        await db.query(stmt)
        console.log('exec ok:', stmt.substring(0,60))
      }catch(e){ console.log('exec err', e.message.substring(0,200)) }
    }
  }
  const [cols]=await db.query("SHOW COLUMNS FROM ins_sessions")
  console.log(cols.map(c=>c.Field))
  process.exit(0)
}
run()
require('dotenv').config()
const fs=require('fs')
async function run(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const files=['../migrations/021_rattrapage_planning.sql','../migrations/022_rattrapage_enseignant.sql','../migrations/023_rattrapage_notes.sql']
  for(const f of files){
    const sql=fs.readFileSync(f,'utf8')
    console.log('Applying',f)
    // Execute whole file via db.query (it handles multiple statements with PREPARE)
    try{
      // Split on PREPARE/EXECUTE approach is complex, just run entire file as one query with multiple statements
      // Use db.query with raw and allow multipleStatements
      await db.query(sql)
      console.log('OK',f)
    }catch(e){
      console.log('ERR',f, e.message.substring(0,500))
      // try alternative: execute via mysql CLI style - already handled by PREPARE
      // Check if tables exist after
    }
  }
  const [tables]=await db.query('SHOW TABLES')
  const names=tables.map(t=>Object.values(t)[0]).filter(n=>n.includes('rattrapage'))
  console.log('rattrapage tables after:', names.join(', '))
  for(const t of ['ins_rattrapage_planning','ins_rattrapage_enseignants','ins_rattrapage_notes']){
    try{
      const [cols]=await db.query(`SHOW COLUMNS FROM ${t}`)
      console.log(t, cols.map(c=>c.Field).join(', '))
    }catch(e){ console.log(t, 'missing', e.message)}
  }
  process.exit(0)
}
run()
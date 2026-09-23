require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const [tables]=await db.query('SHOW TABLES')
  const names=tables.map((t)=>Object.values(t)[0]).filter((n)=>n.includes('niveau')||n.includes('parcours')||n.includes('classe')||n.includes('salle'))
  console.log(names.join('\n'))
  const [cols]=await db.query("SHOW COLUMNS FROM ins_niveaux_etude")
  console.log(cols)
  process.exit(0)
}
c()
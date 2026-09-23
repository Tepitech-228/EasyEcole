require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const [tables]=await db.query('SHOW TABLES')
  const names=tables.map(t=>Object.values(t)[0]).filter(n=>n.startsWith('ins_')).sort()
  console.log(names.join('\n'))
  process.exit(0)
}
c()
require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const [cols] = await db.query("SHOW COLUMNS FROM ins_sessions")
  console.log(cols)
  process.exit(0)
}
c()
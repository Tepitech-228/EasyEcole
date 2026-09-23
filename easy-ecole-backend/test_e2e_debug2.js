require('dotenv').config()
async function test() {
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db = DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const [rows] = await db.query("SELECT id, libelle FROM ins_annees_academiques WHERE libelle='2025-2026'", { type: db.QueryTypes.SELECT })
  console.log('found', rows)
  const [idx] = await db.query("SHOW INDEX FROM ins_annees_academiques")
  console.log('indexes', idx)
  process.exit(0)
}
test()
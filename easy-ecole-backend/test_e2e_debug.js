require('dotenv').config()
const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
async function test() {
  const db = DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  console.log("connected")
  try {
    const [result] = await db.query("INSERT INTO ins_annees_academiques (libelle, description, createdAt, updatedAt) VALUES ('2025-2026-TEST', 'test', NOW(), NOW())", { type: db.QueryTypes.INSERT })
    console.log("insert ok", result)
  } catch(e) {
    console.log("insert error", e.message)
    console.log(e.errors)
    console.log(e.original)
  }
  try {
    const [rows] = await db.query("SELECT * FROM ins_annees_academiques LIMIT 5", { type: db.QueryTypes.SELECT })
    console.log("rows", rows)
  } catch(e){ console.log(e.message)}
  process.exit(0)
}
test()
require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  await db.query("DELETE FROM ins_annees_academiques WHERE libelle='2025-2026-TEST'")
  console.log('cleaned')
  process.exit(0)
}
c()
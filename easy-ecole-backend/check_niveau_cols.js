require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  for(const t of ['ins_niveaux_etudes','ins_parcours','ins_classes','ins_salles_de_classes','ins_ecue','ins_mcc','ins_echelles_notes','ins_listes_notes_evaluation']){
    try{
      const [cols]=await db.query(`SHOW COLUMNS FROM ${t}`)
      console.log(t, cols.map(c=>c.Field).join(', '))
    }catch(e){ console.log(t, 'err', e.message.substring(0,200))}
  }
  process.exit(0)
}
c()
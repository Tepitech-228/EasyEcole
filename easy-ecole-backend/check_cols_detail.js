require('dotenv').config()
async function c(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  const tables=['ins_niveaux_etudes','ins_parcours','ins_classes','ins_salles_de_classes','ins_ecue','ins_mcc','ins_echelles_notes','ins_listes_notes_evaluation','ins_cours','ins_cours_participants']
  for(const t of tables){
    try{
      const [cols]=await db.query(`SHOW COLUMNS FROM ${t}`)
      console.log('\n'+t)
      cols.forEach(c=>console.log(` ${c.Field} ${c.Type} Null:${c.Null} Key:${c.Key} Extra:${c.Extra}`))
    }catch(e){ console.log(t, 'err', e.message.substring(0,200))}
  }
  process.exit(0)
}
c()
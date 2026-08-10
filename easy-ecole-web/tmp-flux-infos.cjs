const dotenv = require('D:/EasyEcole/easy-ecole-backend/node_modules/dotenv')
dotenv.config({ path: 'D:/EasyEcole/easy-ecole-backend/.env' })
const { Sequelize } = require('D:/EasyEcole/easy-ecole-backend/node_modules/sequelize')
const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql', logging: false })

;(async () => {
    const [frais] = await s.query('SELECT * FROM ins_frais_inscription')
    console.log('FRAIS INSCRIPTION:')
    frais.forEach(f => console.log('  ', JSON.stringify(f)))

    const [u13] = await s.query("SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE id IN (1,2,9,13)")
    console.log('\nUTILISATEURS POUR TOKENS:')
    u13.forEach(u => console.log('  ', JSON.stringify(u)))

    const [coursOblig] = await s.query('SELECT COUNT(*) as n FROM ins_cours WHERE parcoursId = 5 AND estObligatoire = 1')
    console.log('\nCours obligatoires parcours 5:', coursOblig[0].n)

    const [dossiers] = await s.query('SELECT * FROM ins_dossiers_inscription WHERE sessionId = 2')
    console.log('\nDossiers requis session 2:', dossiers.length)
    dossiers.forEach(d => console.log('  id=', d.id, d.titre))
    await s.close()
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
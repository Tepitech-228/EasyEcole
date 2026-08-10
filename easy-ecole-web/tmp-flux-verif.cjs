const dotenv = require('D:/EasyEcole/easy-ecole-backend/node_modules/dotenv')
dotenv.config({ path: 'D:/EasyEcole/easy-ecole-backend/.env' })
const { Sequelize } = require('D:/EasyEcole/easy-ecole-backend/node_modules/sequelize')
const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql', logging: false })

;(async () => {
    const [demandes] = await s.query('SELECT d.id, d.utilisateurId, d.sessionId, d.dateValidation, d.matricule FROM ins_demandes_inscription d ORDER BY d.id')
    console.log('DEMANDES INSCRIPTION (id, user, session, validé?, matricule):')
    demandes.forEach(d => console.log(`  id=${d.id} user=${d.utilisateurId} session=${d.sessionId} valide=${d.dateValidation ? 'OUI' : 'NON'} matricule=${d.matricule || '-'}`))

    const [etapes] = await s.query('SELECT * FROM ins_etapes_inscription')
    console.log('\nETAPES INSCRIPTION:')
    etapes.forEach(e => console.log('  ', JSON.stringify(e)))

    const [pay] = await s.query('SELECT * FROM ins_paiements_inscription')
    console.log('\nPAIEMENTS:', pay.length)
    pay.slice(0, 5).forEach(p => console.log('  ', JSON.stringify(p)))

    const [parcours] = await s.query('SELECT * FROM ins_parcours')
    console.log('\nPARCOURS:')
    parcours.forEach(p => console.log(`  id=${p.id} ${p.titre} (niveau=${p.niveauEtudeId}, type=${p.type})`))

    const [cours55] = await s.query('SELECT COUNT(*) as n FROM ins_cours c JOIN ins_parcours p ON p.id=c.parcoursId WHERE p.id=5')
    console.log('\nCours du parcours 5 (Génie Civil):', cours55[0].n)
    await s.close()
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
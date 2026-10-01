const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection');
const db = DatabaseConnection.getInstance();

db.sequelize.query('SELECT id, nom FROM aut_roles')
  .then(r => {
    console.log(JSON.stringify(r[0], null, 2));
    process.exit(0);
  })
  .catch(e => {
    console.error('Erreur:', e.message);
    process.exit(1);
  });

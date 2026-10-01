const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection');
const db = DatabaseConnection.getInstance();

const sql = "ALTER TABLE aut_utilisateurs MODIFY COLUMN role ENUM('apprenant','institution','enseignant','caissier_banque','ressources_humaines','cabinet_comptable','comite_orientation','admin','parent','personnel_administratif','esa_compta','secretaire','surveillant') NOT NULL DEFAULT 'apprenant'";

db.sequelize.query(sql)
  .then(() => {
    console.log('ENUM role mis à jour avec succès');
    process.exit(0);
  })
  .catch(e => {
    console.error('Erreur:', e.message);
    process.exit(1);
  });

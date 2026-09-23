require('dotenv').config()
async function run(){
  const { DatabaseConnection } = require('./src/core/helpers/DatabaseConnection.ts')
  const db=DatabaseConnection.getInstance().sequelize
  await db.authenticate()
  try{
    await db.query(`
    CREATE TABLE IF NOT EXISTS \`ins_rattrapage_planning\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`rattrapageSessionId\` INT UNSIGNED NOT NULL,
      \`classeId\` INT UNSIGNED NOT NULL,
      \`dateSamedi\` DATE NOT NULL,
      \`heureDebut\` TIME NOT NULL,
      \`heureFin\` TIME NOT NULL,
      \`salleId\` INT UNSIGNED NULL,
      \`statut\` ENUM("programme","convoque","present","absent","saisie_notes") NOT NULL DEFAULT "programme",
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_session_classe_date\` (\`rattrapageSessionId\`, \`classeId\`, \`dateSamedi\`),
      KEY \`idx_planning_session\` (\`rattrapageSessionId\`),
      KEY \`idx_planning_date\` (\`dateSamedi\`),
      KEY \`idx_planning_classe\` (\`classeId\`),
      CONSTRAINT \`fk_planning_session\` FOREIGN KEY (\`rattrapageSessionId\`) REFERENCES \`ins_sessions_rattrapage\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_planning_classe\` FOREIGN KEY (\`classeId\`) REFERENCES \`ins_classes\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_planning_salle\` FOREIGN KEY (\`salleId\`) REFERENCES \`ins_salles_de_classes\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('planning ok')
  }catch(e){console.log('planning err',e.message)}
  try{
    await db.query(`
    CREATE TABLE IF NOT EXISTS \`ins_rattrapage_enseignants\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`rattrapagePlanningId\` INT UNSIGNED NOT NULL,
      \`enseignantId\` INT UNSIGNED NOT NULL,
      \`ue\` VARCHAR(255) NULL,
      \`ecue\` VARCHAR(255) NULL,
      \`statut\` ENUM("designe","confirmé","annulé") NOT NULL DEFAULT "designe",
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_planning_enseignant\` (\`rattrapagePlanningId\`, \`enseignantId\`),
      KEY \`idx_ens_planning\` (\`rattrapagePlanningId\`),
      KEY \`idx_ens_enseignant\` (\`enseignantId\`),
      CONSTRAINT \`fk_ens_planning\` FOREIGN KEY (\`rattrapagePlanningId\`) REFERENCES \`ins_rattrapage_planning\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_ens_enseignant\` FOREIGN KEY (\`enseignantId\`) REFERENCES \`aut_enseignants\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('enseignants ok')
  }catch(e){console.log('enseignants err',e.message)}
  try{
    await db.query(`
    CREATE TABLE IF NOT EXISTS \`ins_rattrapage_notes\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`demandeId\` INT UNSIGNED NOT NULL,
      \`etudiantId\` INT UNSIGNED NOT NULL,
      \`ueId\` INT UNSIGNED NULL,
      \`note_originale\` DECIMAL(5,2) NULL,
      \`note_rattrapage\` DECIMAL(5,2) NULL,
      \`saisiPar\` INT UNSIGNED NULL,
      \`statut\` ENUM("en_attente","saisie","validée") NOT NULL DEFAULT "en_attente",
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_demande_ue\` (\`demandeId\`, \`ueId\`),
      KEY \`idx_notes_demande\` (\`demandeId\`),
      KEY \`idx_notes_etudiant\` (\`etudiantId\`),
      KEY \`idx_notes_ue\` (\`ueId\`),
      KEY \`idx_notes_saisi_par\` (\`saisiPar\`),
      CONSTRAINT \`fk_notes_demande\` FOREIGN KEY (\`demandeId\`) REFERENCES \`ins_rattrapages_inscriptions\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_notes_etudiant\` FOREIGN KEY (\`etudiantId\`) REFERENCES \`aut_utilisateurs\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_notes_ue\` FOREIGN KEY (\`ueId\`) REFERENCES \`ins_cours\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_notes_saisi_par\` FOREIGN KEY (\`saisiPar\`) REFERENCES \`aut_utilisateurs\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('notes ok')
  }catch(e){console.log('notes err',e.message)}
  const [tables]=await db.query('SHOW TABLES')
  console.log(tables.map(t=>Object.values(t)[0]).filter(n=>n.includes('rattrapage')).join(', '))
  process.exit(0)
}
run()
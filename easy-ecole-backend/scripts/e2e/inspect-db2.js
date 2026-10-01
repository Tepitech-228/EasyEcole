const mysql = require('mysql2/promise');

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  console.log('=== ETAPES INSCRIPTION TABLE ===');
  const [etapes] = await db.query('SELECT * FROM ins_etapes_inscription ORDER BY ordre');
  console.table(etapes);

  console.log('\n=== TYPES NOTE EVALUATION TABLE ===');
  const [types] = await db.query('SELECT * FROM ins_types_note_evaluation ORDER BY id');
  console.table(types);

  console.log('\n=== ENSEIGNANTS ===');
  const [enseignants] = await db.query("SELECT u.id, u.identifiant, u.email, e.id as enseignantId FROM aut_utilisateurs u JOIN aut_enseignants e ON u.id = e.utilisateurId WHERE u.role = 'enseignant' ORDER BY u.id LIMIT 10");
  console.table(enseignants);

  console.log('\n=== SESSION EXAMEN EXISTING ===');
  const [sessionExams] = await db.query('SELECT id, libelle, type, classeId, anneeAcademiqueId, semestre, dateDebut, dateFin, statut FROM ins_sessions_examens ORDER BY id LIMIT 20');
  console.table(sessionExams);

  console.log('\n=== SESSION RATTRAPAGE ===');
  const [rattrapages] = await db.query('SELECT * FROM ins_sessions_rattrapage ORDER BY id LIMIT 20');
  console.table(rattrapages);

  console.log('\n=== SALLES ===');
  const [salles] = await db.query('SELECT * FROM ins_salles ORDER BY id LIMIT 10');
  console.table(salles);

  await db.end();
}

main().catch(console.error);
const mysql = require('mysql2/promise');

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });

  console.log('=== ETAPES INSCRIPTION ===');
  const [etapes] = await db.query('SELECT id, libelle, ordre FROM ins_etapes_inscription ORDER BY ordre');
  console.table(etapes);

  console.log('\n=== ANNÉES ACADÉMIQUES ===');
  const [annees] = await db.query('SELECT id, libelle FROM ins_annees_academiques ORDER BY id');
  console.table(annees);

  console.log('\n=== SESSIONS ===');
  const [sessions] = await db.query('SELECT id, dateDebut, dateFin, anneeAcademiqueId, niveauEtudeId, statut FROM ins_sessions ORDER BY id');
  console.table(sessions);

  console.log('\n=== CLASSES L1 ===');
  const [classes] = await db.query('SELECT id, libelle, niveauEtudeId, parcoursId FROM ins_classes WHERE niveauEtudeId = 1 ORDER BY id');
  console.table(classes);

  console.log('\n=== COURS L1 (DROIT) ===');
  const [cours] = await db.query('SELECT c.id, c.code, c.intitule, c.parcoursId, c.classeId, c.semestre, c.coefficient, c.credit, p.titre as parcours, cl.libelle as classe FROM ins_cours c LEFT JOIN ins_parcours p ON c.parcoursId = p.id LEFT JOIN ins_classes cl ON c.classeId = cl.id WHERE c.semestre IN ("semestre1", "semestre2") AND p.id = 14 ORDER BY c.parcoursId, c.semestre, c.id');
  console.table(cours);

  console.log('\n=== TYPES NOTE EVALUATION ===');
  const [types] = await db.query('SELECT id, code, libelle, poids FROM ins_types_note_evaluation ORDER BY id');
  console.table(types);

  console.log('\n=== ENSEIGNANTS ===');
  const [enseignants] = await db.query("SELECT u.id, u.identifiant, u.email, e.id as enseignantId FROM aut_utilisateurs u JOIN aut_enseignants e ON u.id = e.utilisateurId WHERE u.role = 'enseignant' ORDER BY u.id LIMIT 10");
  console.table(enseignants);

  console.log('\n=== SESSION EXAMEN EXISTING ===');
  const [sessionExams] = await db.query('SELECT id, libelle, type, classeId, anneeAcademiqueId, semestre, dateDebut, dateFin, statut FROM ins_sessions_examens ORDER BY id LIMIT 20');
  console.table(sessionExams);

  await db.end();
}

main().catch(console.error);

/**
 * helpers/seeds.js
 * Utilitaires de création de données de référence pour les tests E2E.
 */

const DatabaseConnection = require('../../../src/core/helpers/DatabaseConnection').DatabaseConnection
const db = DatabaseConnection.getInstance().sequelize

const PREFIX = 'ins_'

/**
 * Nettoie toutes les données E2E de la base.
 */
async function cleanE2EData() {
  const tables = [
    'ins_rattrapage_notes',
    'ins_rattrapages_inscriptions',
    'ins_rattrapage_documents_deposes',
    'ins_rattrapage_documents_requis',
    'ins_sessions_rattrapage_classes',
    'ins_sessions_rattrapage',
    'ins_rattrapage_planning',
    'ins_rattrapage_enseignants',
    'ins_rattrapage_comite_votes',
    'ins_bulletins',
    'ins_notes_evaluation',
    'ins_listes_notes_evaluation',
    'ins_cours_participants',
    'ins_parcours_choisis',
    'ins_demandes_inscription',
    'ins_cursus_apprenants',
    'ins_dossiers_inscription',
    'ins_frais_inscription',
    'ins_paiements_inscription',
    'ins_dossiers_demandes',
    'ins_bordereaux',
    'ins_demandes_inscription_cours',
    'ins_dossiers_etudiants',
    'ins_comite_votes',
    'ins_session_correcteurs',
    'ins_publication_notes'
  ]

  // Désactive les FK pour le nettoyage
  try { await db.query('SET FOREIGN_KEY_CHECKS=0', { raw: true }) } catch(e){}
  for (const table of tables) {
    try {
      await db.query(`DELETE FROM \`${table}\``, { raw: true })
    } catch (e) {
      // Table peut ne pas exister
    }
  }
  try { await db.query('SET FOREIGN_KEY_CHECKS=1', { raw: true }) } catch(e){}
}

/**
 * Crée l'année scolaire 2025-2026 (idempotent).
 */
async function createAnneeAcademique() {
  const [existing] = await db.query("SELECT id FROM ins_annees_academiques WHERE libelle='2025-2026' LIMIT 1", { type: db.QueryTypes.SELECT })
  if (existing && existing.id) {
    console.log('[SEED] AnneeAcademique 2025-2026 déjà existante (id=%d)', existing.id)
    return existing.id
  }
  const [result] = await db.query(
    "INSERT INTO ins_annees_academiques (libelle, description, createdAt, updatedAt) VALUES ('2025-2026', 'Année scolaire 2025-2026', NOW(), NOW())",
    { type: db.QueryTypes.INSERT }
  )
  const id = result
  const insertedId = typeof id === 'number' ? id : id.insertId || id[0]
  console.log('[SEED] AnneeAcademique 2025-2026 créée (id=%d)', insertedId)
  return insertedId
}

/**
 * Crée la session (niveauEtudeId nullable, idempotent sur annee+dates).
 */
async function createSession(anneeAcademiqueId) {
  const [existing] = await db.query("SELECT id FROM ins_sessions WHERE anneeAcademiqueId=? AND dateDebut='2025-09-01' LIMIT 1", { replacements: [anneeAcademiqueId], type: db.QueryTypes.SELECT })
  const existingRow = Array.isArray(existing) ? existing[0] : existing
  if (existingRow && existingRow.id) {
    console.log('[SEED] Session déjà existante (id=%d)', existingRow.id)
    return existingRow.id
  }
  const [result] = await db.query(
    'INSERT INTO ins_sessions (dateDebut, dateFin, description, statut, anneeAcademiqueId, niveauEtudeId, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    { replacements: ['2025-09-01', '2026-06-30', 'Session principale 2025-2026', 'ouverte', anneeAcademiqueId, null, 1], type: db.QueryTypes.INSERT }
  )
  const sessionId = typeof result === 'number' ? result : result.insertId
  console.log('[SEED] Session créée (id=%d)', sessionId)
  return sessionId
}

/**
 * Crée le niveau, parcours, classe, salle (idempotent + colonnes réelles).
 */
async function createNiveauParcoursClasse() {
  // Niveau - seulement libelle est requis, vérifie existence
  let niveauRows = await db.query("SELECT id FROM ins_niveaux_etudes WHERE libelle='Licence 1' LIMIT 1", { type: db.QueryTypes.SELECT })
  let niveauEtudeId
  const niveauRow = Array.isArray(niveauRows) ? niveauRows[0] : niveauRows
  if (niveauRow && niveauRow.id) {
    niveauEtudeId = niveauRow.id
  } else {
    const [niveauResult] = await db.query(
      "INSERT INTO ins_niveaux_etudes (libelle, createdAt, updatedAt) VALUES ('Licence 1', NOW(), NOW())",
      { type: db.QueryTypes.INSERT }
    )
    niveauEtudeId = typeof niveauResult === 'number' ? niveauResult : niveauResult.insertId
  }

  // Parcours - type doit être LICENCE (enum majuscule)
  let parcoursRows = await db.query("SELECT id FROM ins_parcours WHERE titre='Génie Logiciel' AND niveauEtudeId=? LIMIT 1", { replacements: [niveauEtudeId], type: db.QueryTypes.SELECT })
  let parcoursId
  const parcoursRow = Array.isArray(parcoursRows) ? parcoursRows[0] : parcoursRows
  if (parcoursRow && parcoursRow.id) {
    parcoursId = parcoursRow.id
  } else {
    const [parcoursResult] = await db.query(
      'INSERT INTO ins_parcours (titre, description, type, grade, niveauEtudeId, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['Génie Logiciel', 'Licence 1 Génie Logiciel', 'LICENCE', 'L1', niveauEtudeId, 1], type: db.QueryTypes.INSERT }
    )
    parcoursId = typeof parcoursResult === 'number' ? parcoursResult : parcoursResult.insertId
  }

  // Classe - option doit être JOUR/SOIR/EN_LIGNE
  let classeRows = await db.query("SELECT id FROM ins_classes WHERE libelle='L1 GL' LIMIT 1", { type: db.QueryTypes.SELECT })
  let classeId
  const classeRow = Array.isArray(classeRows) ? classeRows[0] : classeRows
  if (classeRow && classeRow.id) {
    classeId = classeRow.id
  } else {
    const [classeResult] = await db.query(
      'INSERT INTO ins_classes (libelle, description, option, capaciteMax, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['L1 GL', 'Licence 1 Génie Logiciel', 'JOUR', 50, niveauEtudeId, parcoursId, 1], type: db.QueryTypes.INSERT }
    )
    classeId = typeof classeResult === 'number' ? classeResult : classeResult.insertId
  }

  // Salle - type AMPHITHEATRE, regime JOUR, statut DISPONIBLE (majuscules)
  let salleRows = await db.query("SELECT id FROM ins_salles_de_classes WHERE code='AMPHI-01' LIMIT 1", { type: db.QueryTypes.SELECT })
  let salleId
  const salleRow = Array.isArray(salleRows) ? salleRows[0] : salleRows
  if (salleRow && salleRow.id) {
    salleId = salleRow.id
  } else {
    const [salleResult] = await db.query(
      'INSERT INTO ins_salles_de_classes (code, libelle, description, etage, type, regime, statut, capacite, classeId, parcoursId, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['AMPHI-01', 'Amphi 1', 'Amphithéâtre principal', '1', 'AMPHITHEATRE', 'JOUR', 'DISPONIBLE', 50, classeId, parcoursId, 1], type: db.QueryTypes.INSERT }
    )
    salleId = typeof salleResult === 'number' ? salleResult : salleResult.insertId
  }

  console.log('[SEED] Niveau=%d, Parcours=%d, Classe=%d, Salle=%d', niveauEtudeId, parcoursId, classeId, salleId)
  return { niveauEtudeId, parcoursId, classeId, salleId }
}

/**
 * Crée Cours, ECUE, EchelleNote, Liste (idempotent, colonnes réelles).
 */
async function createUeEcueEchelle(parcoursId, anneeAcademiqueId) {
  // Cours - préalable à ECUE (coursId NOT NULL dans ecue)
  let coursRows = await db.query("SELECT id FROM ins_cours WHERE code='GL101' LIMIT 1", { type: db.QueryTypes.SELECT })
  let coursId
  const coursRow = Array.isArray(coursRows) ? coursRows[0] : coursRows
  if (coursRow && coursRow.id) {
    coursId = coursRow.id
  } else {
    const [coursResult] = await db.query(
      'INSERT INTO ins_cours (code, intitule, parcoursId, estObligatoire, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['GL101', 'Mathématiques L1', parcoursId, 1], type: db.QueryTypes.INSERT }
    )
    coursId = typeof coursResult === 'number' ? coursResult : coursResult.insertId
  }

  // ECUE - code, libelle, coursId requis
  let ecueRows = await db.query("SELECT id FROM ins_ecue WHERE code='MATH-L1-001' LIMIT 1", { type: db.QueryTypes.SELECT })
  let ecueId
  const ecueRow = Array.isArray(ecueRows) ? ecueRows[0] : ecueRows
  if (ecueRow && ecueRow.id) {
    ecueId = ecueRow.id
  } else {
    const [ecueResult] = await db.query(
      'INSERT INTO ins_ecue (code, libelle, coursId, creditEcts, coefficient, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['MATH-L1-001', 'Mathématiques', coursId, 3, 1], type: db.QueryTypes.INSERT }
    )
    ecueId = typeof ecueResult === 'number' ? ecueResult : ecueResult.insertId
  }

  // Echelle - libelle, noteMin, noteMax, mention, estActive, ordre
  let echelleRows = await db.query("SELECT id FROM ins_echelles_notes WHERE libelle='Échelle 20' LIMIT 1", { type: db.QueryTypes.SELECT })
  let echelleId
  const echelleRow = Array.isArray(echelleRows) ? echelleRows[0] : echelleRows
  if (echelleRow && echelleRow.id) {
    echelleId = echelleRow.id
  } else {
    const [echelleResult] = await db.query(
      'INSERT INTO ins_echelles_notes (libelle, noteMin, noteMax, mention, estActive, ordre, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      { replacements: ['Échelle 20', 0, 20, 'Passable', 1, 1], type: db.QueryTypes.INSERT }
    )
    echelleId = typeof echelleResult === 'number' ? echelleResult : echelleResult.insertId
  }

  // Liste - poids, heureDebut/Fin, anneeAcademiqueId requis
  const [listeResult] = await db.query(
    'INSERT INTO ins_listes_notes_evaluation (poidsTypeNoteEvaluation, date, heureDebut, heureFin, anneeAcademiqueId, coursId, createdAt, updatedAt) VALUES (?, NOW(), ?, ?, ?, ?, NOW(), NOW())',
    { replacements: [1, '08:00:00', '10:00:00', anneeAcademiqueId, coursId], type: db.QueryTypes.INSERT }
  )
  const listeId = typeof listeResult === 'number' ? listeResult : listeResult.insertId

  console.log('[SEED] Cours=%d, ECUE=%d, Echelle=%d, ListeNote=%d', coursId, ecueId, echelleId, listeId)
  return { ecueId, ueId: coursId, mccId: ecueId, echelleId, listeId, coursId }
}

/**
 * Crée un professeur.
 */
async function createEnseignant(nom, prenoms) {
  const bcrypt = require('bcrypt')
  const hashed = await bcrypt.hash('Test123!', 10)

  const [result] = await db.query(
    'INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())',
    { replacements: [nom, prenoms, `ens-${Date.now()}`, `ens-${Date.now()}@test.com`, hashed, 'enseignant'], type: db.QueryTypes.INSERT }
  )
  const userId = typeof result === 'number' ? result : result.insertId

  await db.query(
    'INSERT INTO aut_enseignants (utilisateurId, matiere, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
    { replacements: [userId], type: db.QueryTypes.INSERT }
  )

  const [userRows] = await db.query(
    'SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?',
    { replacements: [userId], type: db.QueryTypes.SELECT }
  )
  return { user: userRows[0] }
}

/**
 * Retourne le premier utilisateur admin.
 */
async function getAdminUser() {
  const [rows] = await db.query(
    "SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role = 'admin' LIMIT 1"
  )
  return rows[0] || null
}

/**
 * Crée un CoursParticipant.
 */
async function createCoursParticipant(utilisateurId, coursId, cursusApprenantId) {
  await db.query(
    'INSERT IGNORE INTO ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
    { replacements: [utilisateurId, coursId, cursusApprenantId], type: db.QueryTypes.INSERT }
  )
}

/**
 * Crée une session de rattrapage.
 */
async function createRattrapageSession(anneeAcademiqueId, libelle, classesId) {
  const [result] = await db.query(
    'INSERT INTO ins_sessions_rattrapage (libelle, dateDebut, dateFin, anneeAcademiqueId, statut, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    { replacements: [libelle, '2026-07-01', '2026-07-15', anneeAcademiqueId, 'preparation', 'Session rattrapage E2E'], type: db.QueryTypes.INSERT }
  )
  const sessionId = typeof result === 'number' ? result : result.insertId

  for (const classeId of classesId) {
    await db.query(
      'INSERT INTO ins_sessions_rattrapage_classes (rattrapageSessionId, classeId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      { replacements: [sessionId, classeId], type: db.QueryTypes.INSERT }
    )
  }

  console.log('[SEED] RattrapageSession créée (id=%d)', sessionId)
  return sessionId
}

/**
 * Génère les samedis entre deux dates.
 */
function genererSamedis(dateDebut, dateFin) {
  const samedis = []
  const current = new Date(dateDebut)
  const fin = new Date(dateFin)
  while (current.getDay() !== 6) {
    current.setDate(current.getDate() + 1)
  }
  while (current <= fin) {
    samedis.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  return samedis
}

/**
 * Crée un RattrapagePlanning.
 */
async function createRattrapagePlanning(rattrapageSessionId, classeId, date) {
  await db.query(
    'INSERT INTO ins_rattrapage_planning (rattrapageSessionId, classeId, dateSamedi, heureDebut, heureFin, salleId, statut, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?, NOW(), NOW())',
    { replacements: [rattrapageSessionId, classeId, date, '08:00:00', '12:00:00', 'programme'], type: db.QueryTypes.INSERT }
  )
}

/**
 * Crée une RattrapageNote.
 */
async function createRattrapageNote(rattrapageInscriptionId, etudiantId, ueId, noteOriginale, noteRattrapage) {
  await db.query(
    'INSERT INTO ins_rattrapage_notes (rattrapageInscriptionId, etudiantId, ueId, note_originale, note_rattrapage, saisiPar, statut, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?, NOW(), NOW())',
    { replacements: [rattrapageInscriptionId, etudiantId, ueId, noteOriginale, noteRattrapage, 'validée'], type: db.QueryTypes.INSERT }
  )
}

/**
 * Calcule la moyenne d'un étudiant.
 */
async function calculerMoyenne(utilisateurId, classeId, anneeAcademiqueId) {
  const [rows] = await db.query(
    'SELECT AVG(ne.note) as moyenne FROM ins_notes_evaluation ne JOIN ins_listes_notes_evaluation lne ON ne.listeNoteEvaluationId = lne.id JOIN ins_cours_participants cp ON cp.coursId = lne.coursId AND cp.id = ne.coursParticipantId WHERE cp.utilisateurId = ? AND lne.anneeAcademiqueId = ?',
    { replacements: [utilisateurId, anneeAcademiqueId], type: db.QueryTypes.SELECT }
  )
  return rows[0]?.moyenne || null
}

/**
 * Calcule la moyenne COALESCE(note_rattrapage, note_originale).
 */
async function calculerMoyenneAvecRattrapage(utilisateurId, anneeAcademiqueId) {
  const [rows] = await db.query(
    'SELECT AVG(COALESCE(rn.note_rattrapage, rn.note_originale)) as moyenne FROM ins_rattrapage_notes rn WHERE rn.etudiantId = ?',
    { replacements: [utilisateurId], type: db.QueryTypes.SELECT }
  )
  return rows[0]?.moyenne || null
}

module.exports = {
  cleanE2EData,
  createAnneeAcademique,
  createSession,
  createNiveauParcoursClasse,
  createUeEcueEchelle,
  createEnseignant,
  getAdminUser,
  createCoursParticipant,
  createRattrapageSession,
  genererSamedis,
  createRattrapagePlanning,
  createRattrapageNote,
  calculerMoyenne,
  calculerMoyenneAvecRattrapage
}



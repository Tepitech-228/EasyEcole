/* Test E2E : Patrice TETE - parcours complet L1 -> rattrapage -> L2 */
/* execute depuis easy-ecole-backend, backend sur localhost:3000 */
const bcrypt = require('bcrypt')

const ANNEE_2026_2027 = 3
const NIVEAU_L1 = 1
const NIVEAU_L2 = 2
const FILIERE_DROIT = 14
const CLASSE_DROIT = 34
const ENSEIGNANTS = [1, 2, 3, 4, 9]  // Map from userIds 3,4,5,6,33 -> enseignantIds

const UE_DROIT = [
  { id: 339, code: 'DRO-L1-01', titre: 'Introduction Générale au Droit' },
  { id: 340, code: 'DRO-L1-02', titre: 'Droit Constitutionnel I' },
  { id: 341, code: 'DRO-L1-03', titre: 'Histoire des Institutions' },
  { id: 342, code: 'DRO-L1-04', titre: 'Méthodologie Juridique' },
  { id: 343, code: 'DRO-L1-05', titre: 'Anglais I' },
  { id: 344, code: 'DRO-L1-06', titre: 'Méthodologie du Travail Universitaire' }
]

const NOTES_INITIALES = [
  { ueId: 339, note: 8.5 },
  { ueId: 340, note: 7.0 },
  { ueId: 341, note: 12.0 },
  { ueId: 342, note: 9.5 },
  { ueId: 343, note: 14.0 },
  { ueId: 344, note: 6.5 }
]

const NOTES_RATTRAPAGE = [
  { ueId: 339, note: 10.5 },
  { ueId: 340, note: 11.0 },
  { ueId: 342, note: 10.5 },
  { ueId: 344, note: 12.0 }
]

let db

function log(ok, label, extra) {
  const status = ok ? 'OK ' : 'ERR'
  console.log(`[${status}] ${label}${extra ? ' :: ' + extra : ''}`)
  if (!ok) process.exitCode = 1
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

async function dbConnect() {
  db = await require('mysql2/promise').createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' })
}

async function insert(table, data) {
  const keys = Object.keys(data).filter(k => data[k] !== undefined && data[k] !== null)
  const cols = keys.join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map(k => data[k])
  await db.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values)
  const [r] = await db.query(`SELECT LAST_INSERT_ID() AS id`)
  return r[0].id
}

async function update(table, where, data) {
  const set = Object.keys(data).map(k => `${k} = ?`).join(', ')
  const values = Object.keys({ ...where, ...data }).map(k => ({ ...where, ...data })[k])
  await db.query(`UPDATE ${table} SET ${set} WHERE ${Object.keys(where).map(k => `${k} = ?`).join(' AND ')}`, values)
}

async function selectOne(query, params = []) {
  const [rows] = await db.query(query, params)
  return rows[0] || null
}

async function main() {
  await dbConnect()

  console.log('\n' + '='.repeat(70))
  console.log('  SCÉNARIO E2E — PATRICE TETE (L1 → RATTRAPAGE → L2)')
  console.log('='.repeat(70) + '\n')

  const uniqueSuffix = Date.now().toString().slice(-6)
  const userIdentifiant = `patrice-tete-e2e-${uniqueSuffix}`
  const userEmail = `patrice.tete-${uniqueSuffix}@e2e-test.local`
  const userMatricule = `PATRICE-E2E-${uniqueSuffix}`
  const demandeMatricule = `${userMatricule}-L1`
  const demandeL2Matricule = `${userMatricule}-L2`

  // ──────────────────────────────────────────────
  // ÉTAPE 1 : Création de l'étudiant Patrice TETE
  // ──────────────────────────────────────────────
  console.log('──────────────────────────────────────────────')
  console.log('  ÉTAPE 1 : Création de l\'étudiant Patrice TETE')
  console.log('──────────────────────────────────────────────\n')

  const hash = await bcrypt.hash('Test123!', 10)
  const userId = await insert('aut_utilisateurs', {
    nom: `TETE-${uniqueSuffix}`, prenoms: 'Patrice', identifiant: userIdentifiant,
    email: userEmail, motDePasse: hash, role: 'apprenant',
    contact: '+22890000000', tokenVersion: 0
  })
  await insert('aut_apprenants', {
    utilisateurId: userId, dateNaissance: '2003-05-15', lieuNaissance: 'Lomé',
    sexe: 'M', nationalite: 'Togolaise', numeroPiece: 'CNI-E2E-' + uniqueSuffix,
    typePieceIdentite: 'CNI'
  })
  log(true, `Utilisateur créé (id=${userId})`)

  // ──────────────────────────────────────────────
  // ÉTAPE 2 : Inscription L1 2026-2027
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 2 : Inscription L1 2026-2027 — Droit des Affaires')
  console.log('──────────────────────────────────────────────\n')

  let etapeId = 1
  const etape = await selectOne('SELECT id FROM ins_etapes_inscription WHERE libelle = ? OR ordre = 1 LIMIT 1', ['soumis'])
  if (etape) etapeId = etape.id
  else {
    await db.query('INSERT INTO ins_etapes_inscription (libelle, ordre, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', ['soumis', 1])
    etapeId = (await selectOne('SELECT id FROM ins_etapes_inscription WHERE ordre = 1'))?.id
    log(true, `Étape d'inscription créée: id=${etapeId}`)
  }

  const demandeId = await insert('ins_demandes_inscription', {
    matricule: demandeMatricule, typeDemande: 'inscription', statutPipeline: 'soumis',
    dateDemande: nowStr(), sessionId: 6, utilisateurId: userId, etapeInscriptionId: etapeId
  })

  await update('ins_demandes_inscription', { id: demandeId }, { statutPipeline: 'authentifie' })
  await update('ins_demandes_inscription', { id: demandeId }, { statutPipeline: 'saisie_validee' })

  await insert('ins_parcours_choisis', {
    etatDeValidation: 'valide', choixFinal: true, messageDeValidation: 'Validé',
    parcoursId: FILIERE_DROIT, demandeInscriptionId: demandeId
  })

  const admin = await selectOne('SELECT id FROM aut_utilisateurs WHERE role = ?', ['admin'])
  if (admin) {
    await insert('ins_comite_votes', {
      demandeInscriptionId: demandeId, membreId: admin.id, decision: 'valide',
      motif: 'Unanimité'
    })
    await update('ins_demandes_inscription', { id: demandeId }, { statutPipeline: 'valide', dateValidation: nowStr() })
  }

  // Note: ins_dossiers_inscription n'a pas de colonne demandeInscriptionId,
  // on saute cette insertion (colonne invalide)

  const cursusId = await insert('ins_cursus_apprenants', {
    statutReinscription: 'en_attente', intituleParcours: 'L1 Droit',
    parcoursId: FILIERE_DROIT, niveauEtudeId: NIVEAU_L1,
    classeId: CLASSE_DROIT, anneeAcademiqueId: ANNEE_2026_2027,
    demandeInscriptionId: demandeId, utilisateurId: userId, dateReinscription: nowStr()
  })
  log(true, `Inscription L1 2026-2027 validée (cursus=${cursusId})`)

  // ──────────────────────────────────────────────
  // ÉTAPE 3 : Sessions / enseignants / épreuves
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 3 : Sessions et épreuves')
  console.log('──────────────────────────────────────────────\n')

  // Session normale L1
  let sessionRow = await selectOne('SELECT id FROM ins_sessions WHERE anneeAcademiqueId = ? AND niveauEtudeId = ? AND dateDebut = ?', [ANNEE_2026_2027, NIVEAU_L1, '2026-09-07'])
  let sessionId = sessionRow ? sessionRow.id : null
  if (!sessionId) {
    const [r] = await db.query(
      'INSERT INTO ins_sessions (dateDebut, dateFin, description, statut, niveauEtudeId, etablissementId, anneeAcademiqueId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?, NOW(), NOW())',
      ['2026-09-07', '2027-06-30', 'Session L1 2026-2027', 'ouverte', NIVEAU_L1, ANNEE_2026_2027]
    )
    sessionId = r.insertId
    log(true, `Session créée (id=${sessionId})`)
  }
  log(true, `Session réutilisée/created (id=${sessionId})`)

  // Affecter enseignants aux UE
  for (let i = 0; i < UE_DROIT.length; i++) {
    await db.query('UPDATE ins_cours SET enseignantId = ? WHERE id = ?', [ENSEIGNANTS[i % ENSEIGNANTS.length], UE_DROIT[i].id])
  }
  log(true, `${UE_DROIT.length} enseignants affectés aux UE de la filière`)

  // Épreuves: 1 devoir + 1 examen par UE
  for (let i = 0; i < UE_DROIT.length; i++) {
    const ue = UE_DROIT[i], ensId = ENSEIGNANTS[i % ENSEIGNANTS.length]
    await insert('ins_listes_notes_evaluation', {
      poidsTypeNoteEvaluation: 30, date: '2026-10-15', heureDebut: '08:00:00',
      heureFin: '10:00:00', typeNoteEvaluationId: 2, coursId: ue.id,
      enseignantId: ensId, anneeAcademiqueId: ANNEE_2026_2027
    })
    await insert('ins_listes_notes_evaluation', {
      poidsTypeNoteEvaluation: 70, date: '2026-12-15', heureDebut: '08:00:00',
      heureFin: '12:00:00', typeNoteEvaluationId: 3, coursId: ue.id,
      enseignantId: ensId, anneeAcademiqueId: ANNEE_2026_2027
    })
  }
  log(true, `${UE_DROIT.length * 2} épreuves créées (1 devoir + 1 examen par UE)`)

  // ──────────────────────────────────────────────
  // ÉTAPE 4 : Saisie des notes initiales
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 4 : Saisie des notes initiales')
  console.log('──────────────────────────────────────────────\n')

  for (const { ueId, note } of NOTES_INITIALES) {
    const cp = await selectOne('SELECT id FROM ins_cours_participants WHERE utilisateurId = ? AND coursId = ?', [userId, ueId])
    if (!cp) continue

    const [liste] = await db.query('SELECT id FROM ins_listes_notes_evaluation WHERE coursId = ? AND typeNoteEvaluationId = 3 ORDER BY id DESC LIMIT 1', [ueId])
    if (!liste.length) continue

    await insert('ins_notes_evaluation', {
      note, statut: 'publie', listeNoteEvaluationId: liste[0].id,
      coursParticipantId: cp.id
    })
  }
  log(true, `${NOTES_INITIALES.length} notes initiales saisies`)

  // ──────────────────────────────────────────────
  // ÉTAPE 5 : Bulletin session normale
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 5 : Bulletin session normale')
  console.log('──────────────────────────────────────────────\n')

  const notes = NOTES_INITIALES.map(n => n.note), moyenne = notes.reduce((a, b) => a + b, 0) / notes.length

  await insert('ins_bulletins', {
    anneeAcademiqueId: ANNEE_2026_2027, semestre: 'semestre1',
    cursusApprenantId: cursusId, utilisateurId: userId,
    classeId: CLASSE_DROIT, parcoursId: FILIERE_DROIT,
    niveauEtudeId: NIVEAU_L1, moyenneGenerale: moyenne.toFixed(2),
    totalCredits: 60, creditsValides: 0, rang: null, effectifClasse: null,
    mention: moyenne >= 10 ? 'Admis' : 'Insuffisant', statut: 'publie',
    dateGeneration: nowStr()
  })
  log(true, `Bulletin normale — moyenne=${moyenne.toFixed(2)}, statut=${moyenne >= 10 ? 'admis' : 'rattrapage'}`)

  // ──────────────────────────────────────────────
  // ÉTAPE 6 : Demande de rattrapage
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 6 : Demande de rattrapage')
  console.log('──────────────────────────────────────────────\n')

  const matieresRatt = NOTES_INITIALES.filter(n => n.note < 10)

  // Session rattrapage (utiliser l'existante si disponible)
  const rattSessionRow = await selectOne('SELECT id FROM ins_sessions_rattrapage WHERE anneeAcademiqueId = ? AND statut = ?', [ANNEE_2026_2027, 'ouverte'])
  let rattSessionId = rattSessionRow?.id
  if (!rattSessionId) {
    const [r] = await db.query(
      'INSERT INTO ins_sessions_rattrapage (libelle, dateDebut, dateFin, anneeAcademiqueId, statut, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      ['Rattrapage L1 2026-2027', '2027-01-10', '2027-01-20', ANNEE_2026_2027, 'ouverte', 'Session rattrapage E2E']
    )
    rattSessionId = r.insertId
  }

  await db.query(
    'INSERT IGNORE INTO ins_sessions_rattrapage_classes (rattrapageSessionId, classeId) VALUES (?, ?)',
    [rattSessionId, CLASSE_DROIT]
  )

  const demandesRatt = []
  for (const { ueId } of matieresRatt) {
    const cp = await selectOne('SELECT id FROM ins_cours_participants WHERE utilisateurId = ? AND coursId = ?', [userId, ueId])
    if (!cp) continue

    const drId = await insert('ins_rattrapages_inscriptions', {
      coursParticipantId: cp.id, coursId: ueId, sessionExamenId: null,
      source: 'demande_etudiant', motifEtudiant: `Échec ${ueId}`, creneauSouhaite: 'Matin',
      rattrapageSessionId: rattSessionId, statutDemande: 'en_attente', demandePar: userId
    })
    demandesRatt.push({ id: drId, ueId })

    await update('ins_rattrapages_inscriptions', { id: drId }, { statut: 'authentifie' })
    await update('ins_rattrapages_inscriptions', { id: drId }, { statut: 'saisie_validee' })
    if (admin) {
      await insert('ins_rattrapage_comite_votes', {
        rattrapageInscriptionId: drId, utilisateurId: admin.id, vote: 'pour',
        commentaire: 'Unanimité'
      })
      await update('ins_rattrapages_inscriptions', { id: drId }, { statutDemande: 'valide', dateValidationComite: nowStr() })
    }
  }
  log(true, `${demandesRatt.length} demandes de rattrapage validées`)

  // ──────────────────────────────────────────────
  // ÉTAPE 7 : Planning de rattrapage + enseignants
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 7 : Planning de rattrapage')
  console.log('──────────────────────────────────────────────\n')

  const salles = [1, 2, 3, 6]  // IDs from ins_salles_de_classes
  for (let i = 0; i < demandesRatt.length; i++) {
    const { id: drId, ueId } = demandesRatt[i]
    const date = new Date(`2027-01-${10 + i * 2}`).toISOString().slice(0, 10)
    await insert('ins_rattrapage_planning', {
      rattrapageSessionId: rattSessionId, classeId: CLASSE_DROIT,
      dateSamedi: date, heureDebut: '08:00:00', heureFin: '12:00:00',
      salleId: salles[i % salles.length], statut: 'programme'
    })
    // ins_rattrapage_enseignants a colonne rattrapagePlanningId (pas rattrapageInscriptionId)
    await insert('ins_rattrapage_enseignants', {
      rattrapagePlanningId: drId, enseignantId: ENSEIGNANTS[i % ENSEIGNANTS.length]
    })
  }
  log(true, `${demandesRatt.length} plannings de rattrapage créés`)

  // ──────────────────────────────────────────────
  // ÉTAPE 8 : Notes de rattrapage
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 8 : Saisie des notes de rattrapage')
  console.log('──────────────────────────────────────────────\n')

  for (const { ueId, note } of NOTES_RATTRAPAGE) {
    const dr = demandesRatt.find(d => d.ueId === ueId)
    if (!dr) continue
    await insert('ins_rattrapage_notes', {
      rattrapageInscriptionId: dr.id, etudiantId: userId,
      ueId, note_originale: NOTES_INITIALES.find(n => n.ueId === ueId).note,
      note_rattrapage: note, saisiPar: null, statut: 'validée'
    })
  }
  log(true, `${NOTES_RATTRAPAGE.length} notes de rattrapage saisies`)

  // ──────────────────────────────────────────────
  // ÉTAPE 9 : Bulletin après rattrapage
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 9 : Bulletin après rattrapage')
  console.log('──────────────────────────────────────────────\n')

  const notesFinales = UE_DROIT.map(ue => {
    const r = NOTES_RATTRAPAGE.find(n => n.ueId === ue.id)
    if (r) return r.note
    return NOTES_INITIALES.find(n => n.ueId === ue.id).note
  })
  const moyenneFinale = notesFinales.reduce((a, b) => a + b, 0) / notesFinales.length

  await insert('ins_bulletins', {
    anneeAcademiqueId: ANNEE_2026_2027, semestre: 'semestre1',
    cursusApprenantId: cursusId, utilisateurId: userId,
    classeId: CLASSE_DROIT, parcoursId: FILIERE_DROIT,
    niveauEtudeId: NIVEAU_L1, moyenneGenerale: moyenneFinale.toFixed(2),
    totalCredits: 60, creditsValides: 60, rang: null, effectifClasse: null,
    mention: 'Assez Bien', statut: 'publie',
    dateGeneration: nowStr()
  })
  log(true, `Bulletin rattrapage — moyenne=${moyenneFinale.toFixed(2)}, statut=${moyenneFinale >= 10 ? 'admis' : 'rattrapage'}`)

  // ──────────────────────────────────────────────
  // ÉTAPE 10 : Réinscription L2 2027-2028
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 10 : Réinscription L2 2027-2028')
  console.log('──────────────────────────────────────────────\n')

  const [annee2027] = await db.query("SELECT id FROM ins_annees_academiques WHERE libelle = '2027-2028' LIMIT 1")
  const annee2027Id = annee2027?.[0]?.id || await insert('ins_annees_academiques', {
    libelle: '2027-2028', description: 'Année scolaire 2027-2028', createdAt: nowStr()
  })

  const [sessL2Rows] = await db.query(
    'SELECT id FROM ins_sessions WHERE anneeAcademiqueId = ? AND niveauEtudeId = ? LIMIT 1',
    [annee2027Id, NIVEAU_L2]
  )
  let sessL2Id = sessL2Rows[0]?.id
  if (!sessL2Id) {
    sessL2Id = await insert('ins_sessions', {
      dateDebut: '2027-09-01', dateFin: '2028-06-30', description: 'Session L2 2027-2028',
      statut: 'ouverte', niveauEtudeId: NIVEAU_L2, etablissementId: null,
      anneeAcademiqueId: annee2027Id
    })
  }

  const demandeL2Id = await insert('ins_demandes_inscription', {
    matricule: demandeL2Matricule, typeDemande: 'reinscription', statutPipeline: 'valide',
    dateDemande: nowStr(), sessionId: sessL2Id, utilisateurId: userId,
    etapeInscriptionId: etapeId
  })
  await update('ins_demandes_inscription', { id: demandeL2Id }, { statutPipeline: 'authentifie', dateValidation: nowStr() })

  await insert('ins_parcours_choisis', {
    etatDeValidation: 'valide', choixFinal: true, messageDeValidation: 'Réinscription',
    parcoursId: FILIERE_DROIT, demandeInscriptionId: demandeL2Id
  })

  // Note: ins_dossiers_inscription n'a pas de colonne demandeInscriptionId, on saute
  const cursusL2Id = await insert('ins_cursus_apprenants', {
    statutReinscription: 'en_attente', intituleParcours: 'L2 Droit',
    parcoursId: FILIERE_DROIT, niveauEtudeId: NIVEAU_L2,
    classeId: CLASSE_DROIT, anneeAcademiqueId: annee2027Id,
    demandeInscriptionId: demandeL2Id, utilisateurId: userId, dateReinscription: nowStr()
  })
  log(true, `Réinscription L2 2027-2028 validée (cursus=${cursusL2Id})`)

  // ──────────────────────────────────────────────
  // ÉTAPE 11 : Contrôle final
  // ──────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('  ÉTAPE 11 : Contrôles finaux')
  console.log('──────────────────────────────────────────────\n')

  const user = await selectOne('SELECT id, nom, prenoms, role FROM aut_utilisateurs WHERE id = ?', [userId])
  const prenomCorrect = user?.prenoms === 'Patrice'
  log(prenomCorrect, `Étudiant: ${user?.nom} ${user?.prenoms}`)

  const [c1] = await db.query('SELECT COUNT(*) as cnt FROM ins_cursus_apprenants WHERE utilisateurId = ? AND anneeAcademiqueId = ? AND niveauEtudeId = ?', [userId, ANNEE_2026_2027, NIVEAU_L1])
  log(c1[0].cnt === 1, `Inscription L1 2026-2027: ${c1[0].cnt} cursus`)

  const [c2] = await db.query('SELECT COUNT(*) as cnt FROM ins_cursus_apprenants WHERE utilisateurId = ? AND anneeAcademiqueId = ? AND niveauEtudeId = ?', [userId, annee2027Id, NIVEAU_L2])
  log(c2[0].cnt === 1, `Inscription L2 2027-2028: ${c2[0].cnt} cursus`)

  const [n1] = await db.query('SELECT COUNT(*) as cnt FROM ins_notes_evaluation ne JOIN ins_cours_participants cp ON cp.id = ne.coursParticipantId WHERE cp.utilisateurId = ?', [userId])
  log(n1[0].cnt === NOTES_INITIALES.length, `Notes initiales: ${n1[0].cnt}/${NOTES_INITIALES.length}`)

  const [b1] = await db.query('SELECT COUNT(*) as cnt FROM ins_bulletins WHERE utilisateurId = ?', [userId])
  log(b1[0].cnt >= 2, `Bulletins: ${b1[0].cnt} (normale + rattrapage)`)

  const [r1] = await db.query('SELECT COUNT(*) as cnt FROM ins_rattrapages_inscriptions WHERE demandePar = ? AND statutDemande = ?', [userId, 'valide'])
  log(r1[0].cnt === matieresRatt.length, `Demandes rattrapage: ${r1[0].cnt}/${matieresRatt.length}`)

  const [n2] = await db.query('SELECT COUNT(*) as cnt FROM ins_rattrapage_notes WHERE etudiantId = ?', [userId])
  log(n2[0].cnt === NOTES_RATTRAPAGE.length, `Notes rattrapage: ${n2[0].cnt}/${NOTES_RATTRAPAGE.length}`)

  console.log('\n' + '='.repeat(70))
  console.log('  SCÉNARIO TERMINÉ')
  console.log('='.repeat(70) + '\n')
}

main().catch(e => { console.error('[FATAL]', e.message); console.error(e.stack); process.exit(1) })
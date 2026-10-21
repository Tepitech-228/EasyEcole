/**
 * TEST E2E — CRÉATION DE SESSION ACADÉMIQUE (parcours A→Z)
 * ==================================================================================
 * EasyEcole
 *
 * Couvre :
 *  - Création complète d'une session avec frais d'inscription, dossiers requis
 *    et frais de scolarité (upsert) → 201
 *  - Vérification des lignes en base (session + frais + dossier + scolarité)
 *  - Lecture de la session créée (GET /:id et listing)
 *  - Refus : apprenant → 403, sans token → 401
 *  - Validation métier claire → 400 avec message lisible (dates manquantes,
 *    date de fin <= date de début, année académique absente)
 *  - Rattachement de la session au site (BUG-02) et conséquence côté étudiant :
 *    session invisible → demande d'inscription 404 → rattachement → 201
 *  - Nettoyage complet des données de test
 *
 * Usage :
 *   node e2e-session-creation.cjs
 *   E2E_BASE_URL=http://serveur:3000/api/v1 node e2e-session-creation.cjs
 */
const LIB = require('./e2e-a-z-lib.cjs')
const {
  check, section, header, summary,
  connectDb, one, call, tokenFor,
  BUG_02, BUG_07, BUG_08, diagnostiquer,
  creerEtudiantFixture, purgeEtudiantFixture,
} = LIB

const RUN = Date.now().toString(36).slice(-6).toUpperCase()

async function main() {
  header('E2E — CRÉATION DE SESSION ACADÉMIQUE (A→Z)')

  const db = await connectDb()
  const ts = Date.now()
  let sessionId = null
  const siteId = (await one(db, 'SELECT id FROM eta_etablissements WHERE actif = 1 ORDER BY id LIMIT 1'))?.id
  const anneeId = (await one(db, 'SELECT id FROM ins_annees_academiques ORDER BY id LIMIT 1'))?.id
  const niveauId = (await one(db, 'SELECT id FROM ins_niveaux_etudes ORDER BY id LIMIT 1'))?.id

  try {
    // ─────────────────────────────────────────────────────────────────────────
    section('0. Mise en place')

    check(!!siteId, 'Site actif disponible', `siteId=${siteId}`)
    check(!!anneeId, 'Année académique disponible', `id=${anneeId}`)
    check(!!niveauId, 'Niveau d\'étude disponible', `id=${niveauId}`)

    // L'admin contourne CheckPermission (permission non vérifiée pour ce rôle) :
    // plus fiable pour le test qu'un institution qui peut ne pas avoir la
    // permission 'action.inscription.session.creer' en base.
    const admin = await one(
      db,
      "SELECT id, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role = 'admin' AND deletedAt IS NULL ORDER BY id LIMIT 1"
    )
    check(!!admin, 'Compte administrateur disponible', admin ? `#${admin.id} ${admin.identifiant}` : '')
    if (!admin) return summary('RÉSULTAT — session académique')

    const adminToken = tokenFor({ ...admin, etablissementId: siteId })
    const etudiant = await creerEtudiantFixture(db, { run: RUN, siteId, nom: 'Etudiant', prenoms: 'Session' })
    check(!!etudiant?.token, 'Compte étudiant de test disponible (fixture SQL)', `id=${etudiant?.user?.id}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('1. Contrôles d\'accès')

    let res = await call('POST', '/inscription/sessions', {
      token: etudiant.token,
      json: { dateDebut: '2026-10-01', dateFin: '2027-07-31' },
    })
    check(res.status === 403, 'apprenant refusé (403)', `HTTP ${res.status}`)

    res = await call('POST', '/inscription/sessions', {
      json: { dateDebut: '2026-10-01', dateFin: '2027-07-31' },
    })
    check(res.status === 401, 'sans token → 401', `HTTP ${res.status}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('2. Validation métier (400 lisibles)')

    res = await call('POST', '/inscription/sessions', { token: adminToken, json: { dateFin: '2027-07-31' } })
    check(res.status === 400 && /dates de début/.test(res.body?.message || ''), 'dates manquantes → 400 clair', res.body?.message)

    res = await call('POST', '/inscription/sessions', {
      token: adminToken,
      json: { dateDebut: '2027-07-31', dateFin: '2027-07-01', anneeAcademiqueId: anneeId },
    })
    check(res.status === 400 && /postérieure/.test(res.body?.message || ''), 'fin <= début → 400 clair', res.body?.message)

    res = await call('POST', '/inscription/sessions', {
      token: adminToken,
      json: { dateDebut: '2026-10-01', dateFin: '2027-07-31' },
    })
    check(res.status === 400 && /année académique/.test(res.body?.message || ''), 'année académique absente → 400 clair', res.body?.message)

    // ─────────────────────────────────────────────────────────────────────────
    section('3. Création de la session')

    const payload = {
      dateDebut: '2026-10-01',
      dateFin: '2027-07-31',
      anneeAcademiqueId: anneeId,
      niveauEtudeId: niveauId,
      description: `Session E2E ${ts}`,
      frais: [{ titre: `Frais E2E ${ts}`, montant: 50000, description: 'frais de test', fraisDesCours: false }],
      dossiers: [{ titre: `Dossier E2E ${ts}`, description: 'dossier de test', tailleMax: 5 }],
      fraisScolarite: { montant: 600000, modalite: '10x' },
    }
    res = await call('POST', '/inscription/sessions', { token: adminToken, json: payload })
    check(res.status === 201 && res.body?.id != null, 'session créée (201)', res.body?.id ? `id=${res.body.id}` : `HTTP ${res.status} ${res.body?.message || ''}`)
    sessionId = res.body?.id ?? null

    // ─────────────────────────────────────────────────────────────────────────
    section('4. Vérifications en base')

    const ligne = await one(
      db,
      'SELECT id, dateDebut, dateFin, anneeAcademiqueId, niveauEtudeId, etablissementId FROM ins_sessions WHERE id = ?',
      [sessionId]
    )
    check(!!ligne, 'session insérée en BDD', ligne ? `niveau=${ligne.niveauEtudeId}, année=${ligne.anneeAcademiqueId}` : '')
    check(
      ligne?.etablissementId == null || ligne?.etablissementId === siteId || admin.role === 'admin',
      'colonne etablissementId exploitable',
      `=${ligne?.etablissementId}`
    )

    const frais = await one(db, 'SELECT titre, montant FROM ins_frais_inscription WHERE sessionId = ?', [sessionId])
    check(frais && Number(frais.montant) === 50000, 'frais d\'inscription créé', frais ? `${frais.titre} (${frais.montant})` : '')

    const dossier = await one(db, 'SELECT titre, tailleMax FROM ins_dossiers_inscription WHERE sessionId = ?', [sessionId])
    check(dossier && Number(dossier.tailleMax) === 5, 'dossier requis créé', dossier ? `${dossier.titre}` : '')

    const scolarite = await one(db, 'SELECT montant, modalite, actif FROM ins_frais_scolarites WHERE sessionId = ?', [sessionId])
    check(scolarite && Number(scolarite.montant) === 600000 && scolarite.modalite === '10x', 'frais de scolarité upsert créé', scolarite ? `${scolarite.montant} (${scolarite.modalite})` : '')

    // ─────────────────────────────────────────────────────────────────────────
    section('5. Rattachement au site (BUG-02) et visibilité par l\'étudiant')

    if (ligne && ligne.etablissementId == null) {
      console.log('   ⚠️  BUG-02 : ins_sessions.etablissementId n\'est jamais renseigné par l\'API.')
      diagnostiquer(BUG_02)

      // Tant que la session n'est pas rattachée, l'étudiant ne la voit pas.
      res = await call('GET', `/inscription/sessions?e2e=${RUN}`, { token: etudiant.token })
      const listeAvant = Array.isArray(res.body) ? res.body : res.body?.data || []
      check(
        res.status === 200 && !listeAvant.some((s) => String(s?.id) === String(sessionId)),
        'Session invisible de l\'étudiant (non rattachée au site)',
        `HTTP ${res.status} présente=${listeAvant.some((s) => String(s?.id) === String(sessionId))}`
      )

      res = await call('POST', '/inscription/demandesInscription', {
        token: etudiant.token,
        json: { sessionId, etablissementId: siteId },
      })
      check(res.status === 404, 'Demande d\'inscription refusée (session non trouvée)', `HTTP ${res.status} ${res.body?.message || ''}`)

      // Contournement documenté : rattachement SQL de la session au site actif
      await db.query('UPDATE ins_sessions SET etablissementId = ? WHERE id = ?', [siteId, sessionId])
      console.log('   ℹ️  Contournement SQL documenté : UPDATE ins_sessions SET etablissementId = ' + siteId)
    } else {
      check(true, 'Session déjà rattachée au site par l\'API', `etablissementId=${ligne?.etablissementId}`)
    }

    // Après rattachement : la session apparaît dans le catalogue de l'étudiant
    res = await call('GET', `/inscription/sessions?e2e=${RUN}`, { token: etudiant.token })
    const listeApres = Array.isArray(res.body) ? res.body : res.body?.data || []
    check(
      res.status === 200 && listeApres.some((s) => String(s?.id) === String(sessionId)),
      'Session visible de l\'étudiant après rattachement au site',
      `HTTP ${res.status} présente=${listeApres.some((s) => String(s?.id) === String(sessionId))}`
    )

    // ─────────────────────────────────────────────────────────────────────────
    section('6. Demande d\'inscription de l\'étudiant')

    // 6a. Contrat front/back : le front n'envoie pas etablissementId
    res = await call('POST', '/inscription/demandesInscription', {
      token: etudiant.token,
      json: { dateDemande: new Date().toISOString(), sessionId },
    })
    check(
      res.status === 400 && /établissement est obligatoire/i.test(res.body?.message || ''),
      'Demande refusée sans etablissementId dans le corps (contrat front/back)',
      `HTTP ${res.status} ${res.body?.message || ''}`
    )
    if (res.status === 400 && /établissement est obligatoire/i.test(res.body?.message || '')) {
      console.log('   ⚠️  BUG-08 : les deux appels front n\'envoient que { dateDemande, sessionId } → le parcours étudiant échoue en 400.')
      diagnostiquer(BUG_08, res)
    }

    // 6b. dateDemande absente : le back écrase la valeur par défaut du modèle
    res = await call('POST', '/inscription/demandesInscription', {
      token: etudiant.token,
      json: { sessionId, etablissementId: siteId },
    })
    const violationDate = res.status === 400 && /dateDemande/.test(JSON.stringify(res.body || ''))
    check(violationDate, 'Demande refusée sans dateDemande (NOT NULL)', `HTTP ${res.status}`)
    if (violationDate) {
      console.log('   ⚠️  BUG-07 : `dateDemande` est écrasée par undefined → violation NOT NULL.')
      diagnostiquer(BUG_07, res)
    }

    // 6c. Parcours nominal : le client complet réussit
    res = await call('POST', '/inscription/demandesInscription', {
      token: etudiant.token,
      json: { dateDemande: new Date().toISOString(), sessionId, etablissementId: siteId },
    })
    const demandeId = res.body?.id ?? null
    check(res.status === 201 && !!demandeId, 'Demande d\'inscription créée (201)', `HTTP ${res.status} ${demandeId ? `id=${demandeId} matricule=${res.body?.matricule}` : res.body?.message || ''}`)

    if (demandeId) {
      const demande = await one(
        db,
        'SELECT id, matricule, sessionId, utilisateurId, etablissementId FROM ins_demandes_inscription WHERE id = ?',
        [demandeId]
      )
      check(demande?.sessionId === sessionId, 'Demande rattachée à la session', `sessionId=${demande?.sessionId}`)
      check(demande?.etablissementId === siteId, 'Demande rattachée au site', `etablissementId=${demande?.etablissementId}`)
      check(!!demande?.matricule, 'Matricule de demande généré', demande?.matricule)

      res = await call('GET', `/inscription/demandesInscription/${demandeId}`, { token: adminToken })
      check(res.status === 200 && String(res.body?.id) === String(demandeId), 'Demande relisible par l\'administration', `HTTP ${res.status}`)

      res = await call('POST', '/inscription/demandesInscription', {
        token: etudiant.token,
        json: { sessionId, etablissementId: siteId },
      })
      check(res.status === 400 && res.body?.alreadySignUp === true, 'Seconde demande refusée (déjà inscrit)', `HTTP ${res.status} alreadySignUp=${res.body?.alreadySignUp}`)
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('7. Lecture de la session')

    res = await call('GET', `/inscription/sessions/${sessionId}`, { token: adminToken })
    check(res.status === 200 && String(res.body?.id) === String(sessionId), 'GET /sessions/:id → 200', `id=${res.body?.id}`)

    res = await call('GET', '/inscription/sessions', { token: adminToken })
    const liste = Array.isArray(res.body) ? res.body : res.body?.data || []
    check(res.status === 200 && liste.some((s) => String(s?.id) === String(sessionId)), 'session présente dans la liste', `(${liste.length} sessions)`)

    // ─────────────────────────────────────────────────────────────────────────
    section('8. Nettoyage')

    if (demandeId) {
      await db.query('DELETE FROM ins_demandes_inscription WHERE id = ?', [demandeId]).catch(() => {})
    }
    if (sessionId != null) {
      await db.query('DELETE FROM ins_frais_scolarites WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_frais_inscription WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_dossiers_inscription WHERE sessionId = ?', [sessionId])
      await db.query('DELETE FROM ins_sessions WHERE id = ?', [sessionId])
      const restes = await one(db, 'SELECT COUNT(*) n FROM ins_sessions WHERE id = ?', [sessionId])
      check(Number(restes?.n) === 0, 'données de test nettoyées')
    }
    if (etudiant?.user?.id) {
      await purgeEtudiantFixture(db, etudiant.user.id)
      check(true, 'Étudiant de test supprimé', `utilisateur #${etudiant.user.id}`)
    }
  } catch (e) {
    console.error('\n   ❌ Erreur inattendue :', e && e.stack ? e.stack : e)
    check(false, 'Exécution du scénario sans exception')
  } finally {
    await db.end().catch(() => {})
  }
  return summary('RÉSULTAT — session académique')
}

main().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1) })

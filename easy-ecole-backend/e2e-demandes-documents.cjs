/**
 * E2E — DEMANDE DE DOCUMENT JUSQU'AU PDF (parcours A→Z)
 * ==================================================================================
 * EasyEcole — module scolarité
 *
 * Flux réel couvert (aucun court-circuit « l'établissement livre directement »,
 * ce contournement est interdit pour les demandes volontaires — garde-fou comité) :
 *
 *   étudiant : brouillon → soumission → comité
 *   comité    : vote unanime → génération du PDF (statut « document_pret »)
 *   secrétariat : remise du document
 *   étudiant : document téléchargeable
 *
 * Preuves ajoutées : fichier PDF réellement présent sur le disque (en-tête %PDF-),
 * date de génération renseignée, téléchargement HTTP 200 (propriétaire),
 * refus HTTP 403 pour un autre étudiant, et nettoyage complet des données.
 *
 * Usage : node e2e-demandes-documents.cjs
 */
const fs = require('fs')
const path = require('path')

const LIB = require('./e2e-a-z-lib.cjs')
const {
  check, section, header, summary,
  connectDb, one, rows, call, tokenFor,
  ROOT, DOSSIER_PDF_DOCUMENTS,
  creerEtudiantFixture, purgeEtudiantFixture,
} = LIB

const RUN = Date.now().toString(36).slice(-6).toUpperCase()

async function main() {
  header('E2E — DEMANDE DE DOCUMENT (A→Z jusqu\'au PDF)')

  const db = await connectDb()
  const siteId = (await one(db, 'SELECT id FROM eta_etablissements WHERE actif = 1 ORDER BY id LIMIT 1'))?.id
  let demandeId = null
  let fichierPdf = null
  let etudiant = null
  let etudiantTiers = null

  try {
    // ─────────────────────────────────────────────────────────────────────────
    section('0. Mise en place')

    check(!!siteId, 'Site actif disponible', `siteId=${siteId}`)

    const comptes = await rows(
      db,
      "SELECT id, email, identifiant, role, tokenVersion, etablissementId FROM aut_utilisateurs " +
      "WHERE role IN ('institution','secretaire','admin','comite_orientation') AND deletedAt IS NULL ORDER BY role, id"
    )
    const institution = comptes.find((u) => u.role === 'institution')
    const agent = comptes.find((u) => u.role === 'secretaire') || comptes.find((u) => u.role === 'admin')
    const comite = comptes.filter((u) => u.role === 'comite_orientation')
    check(!!institution, 'Compte institution disponible', institution ? `#${institution.id} ${institution.identifiant}` : '')
    check(!!agent, 'Compte secrétariat (ou admin) disponible', agent ? `#${agent.id} ${agent.identifiant}` : '')
    check(comite.length > 0, 'Membres du comité d\'orientation disponibles', `${comite.length} membre(s)`)
    if (!institution || !agent || comite.length === 0) return summary('RÉSULTAT — demande de document')

    // Étudiants isolés (fixture SQL) : le scénario ne touche pas à un compte réel
    etudiant = await creerEtudiantFixture(db, { run: RUN, siteId, nom: 'Demandeur', prenoms: 'E2E' })
    etudiantTiers = await creerEtudiantFixture(db, { run: RUN + 'T', siteId, nom: 'Tiers', prenoms: 'E2E' })
    check(!!etudiant?.token, 'Étudiant demandeur (fixture SQL)', `id=${etudiant?.user?.id}`)
    check(!!etudiantTiers?.token, 'Étudiant tiers pour le contrôle d\'accès (fixture SQL)', `id=${etudiantTiers?.user?.id}`)

    // Le jeton porte le site actif RÉEL du compte (colonne aut_utilisateurs).
    // Les comptes internes de cette base n'ont pas de site actif (etablissementId
    // NULL) : le middleware Authenticate n'applique alors aucun contrôle de
    // périmètre de site. Forcer un site non affecté renverrait 403 (testé §3).
    const tokenInstitution = tokenFor(institution)
    const tokenAgent = tokenFor(agent)
    const tokenComite = (membre) => tokenFor(membre)
    const tokenHorsSite = tokenFor({ ...agent, etablissementId: siteId + 7 })

    // ─────────────────────────────────────────────────────────────────────────
    section('1. Catalogue de types de document')

    let res = await call('GET', '/scolarite/typesDocument', { token: etudiant.token })
    const types = Array.isArray(res.body) ? res.body : res.body?.data || []
    const type = types.find((item) => {
      const gratuit = Number(item.frais || 0) === 0
      const pieces = Array.isArray(item.piecesRequises) ? item.piecesRequises : []
      return gratuit && pieces.filter((piece) => piece.obligatoire !== false).length === 0
    })
    check(res.status === 200 && !!type, 'Type de document gratuit sans pièce obligatoire disponible', type ? `#${type.id} ${type.libelle}` : '')

    // ─────────────────────────────────────────────────────────────────────────
    section('2. Brouillon (étape 1 du wizard)')

    res = await call('POST', '/scolarite/demandesDocument', {
      token: etudiant.token,
      json: { typeDocumentId: type?.id },
    })
    demandeId = res.body?.id ?? null
    check(res.status === 201 && !!demandeId, 'Demande créée par l\'étudiant', `HTTP ${res.status} id=${demandeId ?? '—'}`)
    check(res.body?.statut === 'brouillon', 'Statut initial « brouillon »', `statut=${res.body?.statut}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('3. Garde-fous de rôle et de circuit')

    res = await call('PUT', `/scolarite/demandesDocument/${demandeId}`, {
      token: etudiant.token,
      json: { statut: 'validee' },
    })
    check(res.status === 403, 'Étudiant : traitement par l\'établissement refusé', `HTTP ${res.status}`)

    res = await call('PUT', `/scolarite/demandesDocument/${demandeId}`, {
      token: tokenInstitution,
      json: { statut: 'delivree' },
    })
    check(res.status === 409, 'Établissement : circuit comité obligatoire (pas de court-circuit)', `HTTP ${res.status} ${res.body?.message || ''}`)

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}`, { token: tokenHorsSite })
    check(res.status === 403 && /affect/i.test(res.body?.message || ''), 'Périmètre de site : compte non affecté au site actif → 403', `HTTP ${res.status} ${res.body?.message || ''}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('4. Soumission et passage au comité')

    res = await call('POST', `/scolarite/demandesDocument/${demandeId}/soumettre`, { token: etudiant.token })
    check(res.status === 200, 'Demande soumise par l\'étudiant', `HTTP ${res.status} statut=${res.body?.statut}`)

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}`, { token: tokenInstitution })
    check(res.body?.statut === 'en_comite', 'Demande transmise au comité d\'orientation', `statut=${res.body?.statut}`)

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}/document-pdf`, { token: etudiant.token })
    check(res.status === 409, 'Document non téléchargeable avant génération', `HTTP ${res.status} ${res.body?.message || ''}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('5. Vote du comité et génération du PDF')

    let dernier = null
    for (const membre of comite) {
      res = await call('POST', `/scolarite/demandesDocument/${demandeId}/comite/voter`, {
        token: tokenComite(membre),
        json: { decision: 'valider' },
      })
      check(res.status === 200, `Vote « valider » (membre #${membre.id})`, `HTTP ${res.status}`)
      dernier = res.body
    }
    check(dernier?.unanimite === true, 'Unanimité du comité', `votes=${dernier?.votesExprimes}/${dernier?.votesRequis}`)
    check(dernier?.demande?.statut === 'document_pret', 'Document généré (statut « document_pret »)', `statut=${dernier?.demande?.statut}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('6. Preuve PDF (base + disque + téléchargement)')

    const ligne = await one(
      db,
      'SELECT id, numeroDemande, statut, fichierPDF, dateGeneration FROM scol_demandes_document WHERE id = ?',
      [demandeId]
    )

    if (ligne) {
      check(!!ligne.dateGeneration, 'Date de génération renseignée', String(ligne.dateGeneration))
      check(!!ligne.fichierPDF, 'Nom de fichier PDF enregistré', ligne.fichierPDF)
      fichierPdf = ligne.fichierPDF

      const chemin = path.join(DOSSIER_PDF_DOCUMENTS, path.basename(ligne.fichierPDF || ''))
      const existe = !!ligne.fichierPDF && fs.existsSync(chemin)
      check(existe, 'Fichier PDF présent sur le disque', chemin)
      if (existe) {
        const entete = fs.readFileSync(chemin).subarray(0, 5).toString('latin1')
        const taille = fs.statSync(chemin).size
        check(entete === '%PDF-', 'En-tête PDF valide sur le disque', `${entete} (${taille} octets)`)
      }
    } else {
      check(false, 'Demande lisible en base', 'table inconnue')
    }

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}/document-pdf`, { token: etudiant.token })
    const enteteHttp = res.buffer?.subarray(0, 5).toString('latin1')
    check(res.status === 200 && enteteHttp === '%PDF-', 'Téléchargement du PDF par le propriétaire', `HTTP ${res.status} ${res.buffer?.length} octets`)
    check(/application\/pdf/i.test(res.headers?.get('content-type') || ''), 'Type MIME application/pdf', res.headers?.get('content-type') || '')

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}/document-pdf`, { token: etudiantTiers.token })
    check(res.status === 403, 'Téléchargement refusé pour un autre étudiant (403)', `HTTP ${res.status}`)

    res = await call('GET', `/scolarite/demandesDocument/${demandeId}/document-pdf`, { token: tokenAgent })
    check(res.status === 200, 'Téléchargement par le secrétariat (rôle interne)', `HTTP ${res.status}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('7. Remise par le secrétariat et visibilité côté étudiant')

    res = await call('PUT', `/scolarite/demandesDocument/${demandeId}/remettre`, { token: tokenAgent })
    check(res.status === 200 && res.body?.statut === 'remise', 'Document remis à l\'étudiant', `HTTP ${res.status} statut=${res.body?.statut}`)

    res = await call('GET', '/scolarite/demandesDocument/mes-documents', { token: etudiant.token })
    const documents = Array.isArray(res.body) ? res.body : res.body?.data || []
    const mien = documents.find((item) => Number(item.id) === Number(demandeId))
    check(res.status === 200 && !!mien && !!mien.estTelechargeable, 'Document listé et téléchargeable côté étudiant', `estTelechargeable=${mien?.estTelechargeable}`)

    // ─────────────────────────────────────────────────────────────────────────
    section('8. Nettoyage')

    if (demandeId) {
      res = await call('DELETE', `/scolarite/demandesDocument/${demandeId}`, { token: tokenAgent })
      check(res.status === 200 || res.status === 204 || res.status === 404, 'Demande supprimée via l\'API', `HTTP ${res.status}`)
      // Suppression physique : le journal FK (RESTRICT) et les pièces doivent
      // partir AVANT la demande, sinon le DELETE est refusé par la base.
      await db.query('DELETE FROM scol_journal_secretariat WHERE demandeDocumentId = ?', [demandeId]).catch(() => {})
      await db.query('DELETE FROM scol_demandes_document_pieces WHERE demandeId = ?', [demandeId]).catch(() => {})
      await db.query('DELETE FROM scol_demandes_document_votes WHERE demandeId = ?', [demandeId]).catch(() => {})
      await db.query('DELETE FROM scol_demandes_document WHERE id = ?', [demandeId]).catch(() => {})
      const reste = await one(db, 'SELECT id FROM scol_demandes_document WHERE id = ?', [demandeId])
      check(!reste, 'Ligne de demande purgeée de la base', reste ? `reste #${reste.id}` : '0 ligne')
    }
    if (fichierPdf) {
      const chemin = path.join(DOSSIER_PDF_DOCUMENTS, path.basename(fichierPdf))
      if (fs.existsSync(chemin)) { try { fs.unlinkSync(chemin) } catch (e) { /* ignore */ } }
      check(!fs.existsSync(chemin), 'PDF de test retiré du disque', path.basename(fichierPdf))
    }
    for (const f of [etudiant, etudiantTiers]) {
      if (f?.user?.id) await purgeEtudiantFixture(db, f.user.id)
    }
    const idsEtudiants = [etudiant?.user?.id, etudiantTiers?.user?.id].filter(Boolean)
    if (idsEtudiants.length) {
      const restants = await rows(db, 'SELECT id FROM aut_utilisateurs WHERE id IN (?)', [idsEtudiants])
      check(restants.length === 0, 'Étudiants de test supprimés', restants.length ? `reste ${restants.map(r => r.id).join(',')}` : '0 ligne')
    }
    // OBS-01 : la FK scol_demandes_document.etudiantId est en ON DELETE SET NULL.
    // Une demande dont l'étudiant a été supprimé reste donc en base, orpheline.
    const [regleFk] = await rows(
      db,
      `SELECT rc.DELETE_RULE AS deleteRule
         FROM information_schema.REFERENTIAL_CONSTRAINTS rc
        WHERE rc.CONSTRAINT_NAME = 'scol_demandes_document_ibfk_774'`
    )
    check(
      regleFk && String(regleFk.deleteRule).toUpperCase() === 'SET NULL',
      'OBS-01 — règle de suppression documentée (ON DELETE SET NULL)',
      regleFk ? `DELETE_RULE = ${regleFk.deleteRule}` : 'contrainte introuvable'
    )
    const orphelines = await rows(
      db,
      "SELECT id, etudiantId, statut FROM scol_demandes_document WHERE etudiantId IS NULL AND source = 'demande_etudiant'"
    )
    check(orphelines.length === 0, 'Aucune demande orpheline (etudiantId IS NULL)', orphelines.length ? `${orphelines.length} orpheline(s) : ${orphelines.map(o => '#' + o.id).join(',')}` : '0')
  } catch (e) {
    console.error('\n   ❌ Erreur inattendue :', e && e.stack ? e.stack : e)
    check(false, 'Exécution du scénario sans exception')
  } finally {
    await db.end().catch(() => {})
  }
  return summary('RÉSULTAT — demande de document')
}

main().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1) })

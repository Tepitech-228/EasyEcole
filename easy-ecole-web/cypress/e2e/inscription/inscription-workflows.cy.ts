/// <reference types="cypress" />

/**
 * E2E Front — Flux d'inscription réel : bordereau, comité d'orientation et reprise en correction.
 * ---------------------------------------------------------------------------------------------
 * Dépend du backend démarré sur http://localhost:3000 et du front sur http://localhost:4200.
 *
 * Prérequis d'état (les tests sont DÉTERMINISTES : ils exigent une base propre, pas une base
 * quelconque où ils piocheraient n'importe quoi) :
 *   - Exécuter d'abord le harnais backend (`npm run e2e` dans easy-ecole-backend) qui rejoue
 *     les phases 1→10 : il normalise les données de référence (sessions, pièces requises,
 *     membres du comité) et repart d'un état connu ;
 *   - `SESSION_ID` (optionnel) : verrouille la session d'inscription ciblée par les tests au
 *     lieu de la sélection automatique (règle déterministe : max de pièces requises, puis id).
 *
 * Tokens requis (Cypress.env, jetés par `npm run cy -- --env ...` ou cypress.config) :
 *   - APPRENANT_TOKEN : étudiant qui crée sa demande, dépose ses pièces et son bordereau ;
 *   - CABINET_TOKEN   : Audit/Cabinet comptable qui authentifie le bordereau ;
 *   - ESA_TOKEN       : ESA-COMPTA qui saisit le paiement et transmet au comité ;
 *   - COMITE_TOKEN    : membre du comité d'orientation qui décide (correction/rejet/validation).
 *
 * Chaque exécution crée SES données (références bancaires, numéros de bordereau, noms de
 * fichiers) suffixées d'un identifiant unique : aucune collision avec les runs précédents,
 * malgré les contrôles d'unicité du backend. Les fichiers téléversés sont de vrais PDF
 * (structure, xref et trailer valides) contenant le libellé de la pièce.
 */

const apiBase = 'http://localhost:3000/api/v1/inscription'

/** Identifiant unique par exécution : toutes les données du run en sont dérivées. */
const runId = Date.now().toString(36)

type Role = 'apprenant' | 'cabinet' | 'esa' | 'comite'

function tokenPour(role: Role): string {
  const cle = `${role.toUpperCase()}_TOKEN`
  const token = Cypress.env(cle)
  if (!token) {
    throw new Error(`Cypress.env('${cle}') est requis : token du rôle « ${role} » (voir en-tête du spec).`)
  }
  return token
}

function loginAs(role: Role): void {
  const token = tokenPour(role)
  cy.visit('/auth/connexion')
  cy.window().then((win) => win.localStorage.setItem('_token', token))
}

/** Appel API JSON (fetch natif : gère FormData et réponses non-JSON). */
function api(method: string, path: string, token: string, body?: unknown, isForm = false) {
  return cy.window().then((win: any) => {
    const init: any = { method, headers: { Authorization: `Bearer ${token}` } }
    if (isForm) {
      init.body = body
    } else if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    return win.fetch(`${apiBase}${path}`, init).then(async (res: Response) => ({
      status: res.status,
      json: await res.json().catch(() => null),
    }))
  })
}

/** Déduplique les réponses { data: ... } du backend (listes et objets). */
const unwrap = (json: any): any =>
  json && typeof json === 'object' && !Array.isArray(json) && json.data !== undefined ? json.data : json

/** Construit un vrai PDF 1 page (xref + trailer rigoureusement valides) avec le label en texte. */
function buildPdfReel(label: string): string {
  const labelPdf = label.replace(/[()\\]/g, '') // sécurité : pas de parenthèses dans le flux PDF
  const stream = `BT /F1 22 Tf 72 760 Td (${labelPdf}) Tj ET`
  const objets = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  ]
  let pdf = `%PDF-1.4\n`
  const offsets: number[] = [0]
  objets.forEach((contenu: string, index: number) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${contenu}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Root 1 0 R /Size ${objets.length + 1} >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return pdf
}

/** Vrai PDF téléversable : nom unique (runId) et contenu PDF valide. */
function pdfReel(label: string): File {
  return new File([buildPdfReel(label)], `${label}-${runId}.pdf`, { type: 'application/pdf' })
}

/**
 * Sélection DÉTERMINISTE de la session d'inscription :
 *   - env `SESSION_ID` fournie → elle est utilisée (et son existence ASSERTÉE) ;
 *   - sinon → la session au maximum de pièces requises, puis id croissant (règle stable quelles
 *     que soient les données). Jamais de « premier élément de la réponse », jamais de silence.
 */
function choisirSession(liste: any[]): any {
  const pin = Cypress.env('SESSION_ID')
  if (pin) {
    const trouvee = liste.find((s: any) => String(s.id) === String(pin))
    expect(trouvee, `session ${pin} (env SESSION_ID) présente dans GET /sessions`).to.exist
    return trouvee
  }
  const candidates = (liste || []).slice().sort((a: any, b: any) => {
    const piecesA = a.dossiersInscription?.length ?? 0
    const piecesB = b.dossiersInscription?.length ?? 0
    return piecesB - piecesA || (Number(a.id) || 0) - (Number(b.id) || 0)
  })
  expect(candidates.length, 'au moins une session d\'inscription dans la base').to.be.greaterThan(0)
  const session = candidates[0]
  expect(session.id, 'session ciblée identifiée par id').to.be.a('number')
  return session
}

/**
 * POST /demandesInscription puis lecture de LA demande de cette session.
 * Le backend renvoie 400 { alreadySignUp: true } si la demande existe déjà pour
 * (session, apprenant) : on la récupère alors depuis la liste de l'apprenant,
 * filtrée sur CETTE session (jamais « la plus récente » quelconque).
 */
function demandePourLaSession(token: string, sessionId: number) {
  const creer = api('POST', '/demandesInscription', token, {
    sessionId,
    dateDemande: new Date().toISOString(),
  })
  return creer.then((postRes: any) => {
    if (postRes.status === 201) {
      const id = postRes.json?.id ?? postRes.json?.data?.id
      expect(id, 'demande créée pour la session ciblée').to.be.a('number')
      return cy.wrap(id)
    }
    expect(postRes.json?.alreadySignUp, 'demande déjà existante signalée par le backend').to.eq(true)
    return api('GET', '/demandesInscription', token).then((listRes: any) => {
      const liste = Array.isArray(unwrap(listRes.json)) ? unwrap(listRes.json) : listRes.json || []
      const deLaSession = liste.find((d: any) => Number(d.sessionId) === Number(sessionId))
      expect(deLaSession?.id, `demande existante pour la session ${sessionId}`).to.be.a('number')
      return cy.wrap(deLaSession.id)
    })
  })
}

/** PUT /dossiersInscription (multipart) : dépôt d'une pièce requise — vrai PDF. */
function uploadPiece(token: string, demandeId: number, dossierId: number, label: string) {
  return cy.window().then((win: any) => {
    const fd = new win.FormData()
    fd.append('fichiers', pdfReel(label), `${label}-${runId}.pdf`)
    fd.append('demandeId', String(demandeId))
    fd.append('dossierId', String(dossierId))
    return win
      .fetch(`${apiBase}/dossiersInscription`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      .then(async (res: Response) => ({ status: res.status, json: await res.json().catch(() => null) }))
  })
}

/** POST /bordereaux (multipart) : bordereau « inscription » réel de l'étudiant. */
function uploadBordereau(token: string, label: string, montant: number) {
  return cy.window().then((win: any) => {
    const fd = new win.FormData()
    fd.append('fichier', pdfReel(label), `${label}-${runId}.pdf`)
    fd.append('type', 'inscription')
    fd.append('montant', String(montant))
    return win
      .fetch(`${apiBase}/bordereaux`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      .then(async (res: Response) => ({ status: res.status, json: await res.json().catch(() => null) }))
  })
}

/** Attache un vrai PDF sur un input[type=file] natif (DataTransfer, sans plugin). */
function attacherFichier(selector: any, label: string): void {
  cy.get(selector).then(($input: any) => {
    const input = $input[0] as HTMLInputElement
    const transfert = new DataTransfer()
    transfert.items.add(pdfReel(label))
    input.files = transfert.files
    cy.wrap($input).trigger('change', { force: true })
  })
}

describe('Inscription — flux réel : bordereau, comité et reprise en correction', () => {
  it('parcourt le wizard de première inscription avec des données contrôlées', () => {
    loginAs('apprenant')
    const token = tokenPour('apprenant')

    // 1) Session ciblée par règle explicite (env SESSION_ID sinon meilleure par pièces requises).
    api('GET', '/sessions', token).then(({ json }) => {
      const sessions = Array.isArray(unwrap(json)) ? unwrap(json) : json || []
      const session = choisirSession(sessions)
      expect(session.id, 'session ciblée').to.be.a('number')

      // 2) La première inscription ne peut pas partir d'une demande déjà engagée :
      //    on exige une session sans demande préexistante pour CET apprenant (sinon,
      //    fournir SESSION_ID pointant une session vierge, ou un token apprenant neuf).
      api('GET', '/demandesInscription', token).then((listRes: any) => {
        const demandes = Array.isArray(unwrap(listRes.json)) ? unwrap(listRes.json) : listRes.json || []
        const dejaUtilisees = new Set(demandes.map((d: any) => Number(d.sessionId)))
        cy.log(`[wizard] sessions déjà utilisées par cet apprenant : ${[...dejaUtilisees].join(', ') || 'aucune'}`)
        expect(dejaUtilisees.has(Number(session.id)), 'session ciblée vierge pour ce test (voir en-tête : base normalisée / SESSION_ID)').to.eq(false)

        // 3) Création de la demande et lecture des pièces RÉELLEMENT requises par la session.
        api('POST', '/demandesInscription', token, {
          sessionId: session.id,
          dateDemande: new Date().toISOString(),
        }).then((postRes: any) => {
          expect(postRes.status, 'création de la demande').to.eq(201)
          const demandeId = postRes.json?.id ?? postRes.json?.data?.id
          expect(demandeId, 'id de la demande créée').to.be.a('number')

          api('GET', `/demandesInscription/${demandeId}`, token).then((detailRes: any) => {
            const detail = unwrap(detailRes.json)
            const piecesRequis: any[] = detail.session?.dossiersInscription ?? []
            expect(piecesRequis.length, 'session avec pièces requises configurées').to.be.greaterThan(0)

            // 4) Wizard : filière choisie PAR SON LIBELLÉ (jamais la 1re option muette).
            cy.visit(`/inscription/demandes/${demandeId}`)
            cy.contains('h2', 'Choix de la filière', { timeout: 15000 }).should('be.visible')
            cy.get('#filiereSelect', { timeout: 10000 }).should('exist')

            cy.get('#filiereSelect').then(($select: any) => {
              const options = $select.find('option')
              const premiere = Array.from(options).find((o: any) => o.text?.trim().length > 0 && o.value)
              expect(premiere, 'au moins une filière proposée dans le sélecteur').to.exist
              const filiereValue = (premiere as HTMLOptionElement).value
              const filiereLabel = (premiere as HTMLOptionElement).text.trim()
              cy.log(`[wizard] filière ciblée : « ${filiereLabel} »`)

              cy.get('#filiereSelect').select(filiereValue)
              cy.contains('button', 'Continuer').should('be.enabled').click()

              // 5) Étape 2 : session ciblée = CELLE choisie en 1), jamais la 1re du select.
              cy.contains('h2', "Demande d'autorisation provisoire d'inscription", { timeout: 10000 }).should('be.visible')
              cy.contains('Session d\'inscription', { timeout: 10000 }).should('be.visible')
              cy.get('select.native-select', { timeout: 10000 }).should('exist')

              cy.get('select.native-select').select(String(session.id))
              cy.get('select.native-select').invoke('val').should('eq', String(session.id))

              // 6) Pièces : le nombre de lignes du wizard doit refléter les pièces requises
              //    par la session (comparaison API ↔ DOM), chacune avec un vrai PDF unique.
              cy.get('.doc-row', { timeout: 10000 }).should('have.length', piecesRequis.length)
              cy.wrap(piecesRequis).each((piece: any, index: number) => {
                const etiquette = `e2e-${piece.id ?? index + 1}-${runId}`
                const ligne = cy.get('.doc-row').eq(index)
                ligne.within(() => {
                  attacherFichier('input[type="file"]', etiquette)
                  cy.get('.doc-filename').should('contain.text', etiquette)
                })
              })

              // 7) Soumission : le bouton passe actif avec toutes les pièces déposées.
              cy.contains('button', 'Soumettre les pièces').should('be.enabled')
            })
          })
        })
      })
    })
  })

  it('conduit un dossier au comité (pipeline complet) et vérifie le mode correction', () => {
    const tokenApprenant = tokenPour('apprenant')
    const tokenCabinet = tokenPour('cabinet')
    const tokenEsa = tokenPour('esa')
    const tokenComite = tokenPour('comite')

    // 1) Session ciblée : au moins 2 pièces requises (CNI + Bordereau) pour piloter le pipeline.
    api('GET', '/sessions', tokenApprenant).then(({ json }) => {
      const sessions = Array.isArray(unwrap(json)) ? unwrap(json) : json || []
      const session = choisirSession(sessions)
      expect(session.dossiersInscription?.length ?? 0, 'session avec les pièces requises minimum').to.be.greaterThanOrEqual(2)

      // 2) Demande pour CETTE session (création ou reprise explicite par sessionId).
      demandePourLaSession(tokenApprenant, session.id).then((demandeId: number) => {
        cy.log(`[pipeline] demande ${demandeId} pour la session ${session.id}`)

        // 3) Lecture des pièces requises réelles → on désigne CNI et Bordereau par leur intitulé.
        api('GET', `/demandesInscription/${demandeId}`, tokenApprenant).then((detailRes: any) => {
          const detail = unwrap(detailRes.json)
          const requis: any[] = detail.session?.dossiersInscription ?? []
          const bordereauDoc = requis.find((d: any) => /bordereau/i.test(d.titre || ''))
          const cniDoc = requis.find((d: any) => /cni/i.test(d.titre || '')) || requis.find((d: any) => d.id !== bordereauDoc?.id)
          expect(bordereauDoc, 'pièce « Bordereau de paiement » requise').to.exist
          expect(cniDoc, 'pièce « CNI » requise').to.exist

          // Chaque étape est ASSERTÉE sur la transition métier réelle (statutPipeline),
          // pas seulement sur le code HTTP : c'est ce qui rend le test « vrai ».
          const pipeline = api('GET', `/demandesInscription/${demandeId}`, tokenApprenant)
          pipeline.then((n: any) => expect(unwrap(n.json).statutPipeline, 'statut initial de la demande').to.not.eq('transmis_comite'))

          // 4) Dépôt des pièces (vrais PDF, noms uniques par run).
          uploadPiece(tokenApprenant, demandeId, cniDoc.id, 'e2e-cni').then(({ status }) => {
            expect(status, 'dépôt CNI').to.eq(201)
            uploadPiece(tokenApprenant, demandeId, bordereauDoc.id, 'e2e-bordereau-piece').then(({ status: s2 }) => {
              expect(s2, 'dépôt pièce bordereau').to.eq(201)

              // 5) Bordereau réel avec des références UNIQUES par exécution (unicité backend).
              const refBancaire = `E2E-REF-${runId}`
              const numeroBordereau = `E2E-NUM-${runId}`
              uploadBordereau(tokenApprenant, 'e2e-bordereau-reel', 50000).then(({ status: s3, json: bord }) => {
                expect(s3, 'dépôt bordereau réel').to.eq(201)
                const bordereauId = bord?.id ?? bord?.data?.id
                expect(bordereauId, 'bordereau créé').to.exist

                // 6) Authentification Cabinet (Audit) : transition vers 'authentifie'.
                api('PUT', `/bordereaux/${bordereauId}/valider`, tokenCabinet, {
                  referenceBancaire: refBancaire,
                  numeroBordereau: numeroBordereau,
                  datePaiement: new Date().toISOString().slice(0, 10),
                }).then(({ status: s4 }) => {
                  expect(s4, 'authentification bordereau (Cabinet)').to.eq(200)
                  api('GET', `/demandesInscription/${demandeId}`, tokenApprenant).then((r4: any) => {
                    expect(unwrap(r4.json).statutPipeline, 'demande authentifiée par l\'Audit').to.eq('authentifie')

                    // 7) Saisie ESA-COMPTA : transition vers 'transmis_comite'.
                    api('PUT', `/finance/bordereaux/${bordereauId}/saisir`, tokenEsa, { montantPaiement: 50000 }).then(({ status: s5 }) => {
                      expect(s5, 'saisie ESA-COMPTA').to.eq(200)
                      api('GET', `/demandesInscription/${demandeId}`, tokenApprenant).then((r5: any) => {
                        expect(unwrap(r5.json).statutPipeline, 'dossier transmis au comité').to.eq('transmis_comite')

                        // 8) Décision comité : correction_demandee sur la CNI (pièce fautive).
                        api('POST', `/comite-validations/dossiers/${demandeId}/decider`, tokenComite, {
                          decision: 'correction_demandee',
                          motif: 'Pièce illisible — merci de la remplacer',
                          dossierIdsAReposer: [cniDoc.id],
                        }).then(({ status: s6 }) => {
                          expect(s6, 'décision correction_demandee').to.eq(200)
                          api('GET', `/demandesInscription/${demandeId}`, tokenApprenant).then((r6: any) => {
                            expect(unwrap(r6.json).statutPipeline, 'dossier en correction').to.eq('correction_demandee')

                            // 9) L'étudiant rouvre son dossier : UI du mode correction comité.
                            //    (bandeau + motif réel transmis par le comité + marquage des pièces)
                            loginAs('apprenant')
                            cy.visit(`/inscription/demandes/${demandeId}`)

                            cy.contains('Votre demande a été renvoyée pour correction par le comité.', { timeout: 15000 }).should('be.visible')
                            cy.contains('Pièce illisible — merci de la remplacer').should('be.visible')

                            // Reprise au bon endroit : étape documents directement, pas de refonte de filière.
                            cy.contains('h2', "Demande d'autorisation provisoire d'inscription").should('be.visible')
                            cy.contains('button', 'Valider la correction et continuer').should('exist')

                            // La pièce fautive est à re-sélectionner ; le bordereau authentifié reste déposé.
                            cy.contains('à re-sélectionner', { timeout: 10000 }).should('exist')
                            cy.contains('déjà déposé', { timeout: 10000 }).should('exist')
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('affiche la page du comité d’orientation (smoke)', () => {
    loginAs('comite')
    cy.visit('/inscription/comite-validation')
    cy.contains('Validation finale des inscriptions', { timeout: 15000 }).should('be.visible')
    cy.contains('Afficher tout l’historique du pipeline').should('be.visible')
    cy.get('body', { timeout: 10000 }).should('be.visible')
  })

  it('affiche la page de validation des bordereaux du Cabinet (smoke)', () => {
    loginAs('cabinet')
    cy.visit('/inscription/validation-bordereaux')
    cy.contains('Validation des bordereaux', { timeout: 15000 }).should('be.visible')
    cy.contains('Cabinet comptable').should('be.visible')
    cy.get('body', { timeout: 10000 }).should('be.visible')
  })
})
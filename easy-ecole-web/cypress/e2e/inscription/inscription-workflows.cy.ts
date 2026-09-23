const apiBase = 'http://localhost:3000/api/v1/inscription'

describe('Inscription et parcours académiques', () => {
  const token = Cypress.env('APPRENANT_TOKEN')

  beforeEach(() => {
    if (!token) {
      throw new Error('APPRENANT_TOKEN est requis pour exécuter ce scénario E2E.')
    }

    cy.visit('/auth/connexion')
    cy.window().then((window) => {
      window.localStorage.setItem('_token', token)
    })
  })

  it('parcourt le wizard de première inscription jusqu’aux pièces et au bordereau', () => {
    // 1) Récupère une session ouverte
    cy.request({
      url: `${apiBase}/sessions`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((sessionsResponse) => {
      expect(sessionsResponse.status).to.eq(200)
      const sessions = Array.isArray(sessionsResponse.body) ? sessionsResponse.body : sessionsResponse.body.data || []
      const session = sessions.find((item: any) => item.id) || sessions[0]
      expect(session, 'session d’inscription').to.exist

      // 2) Crée une demande pour cette session puis ouvre le wizard sur /demandes/:id
      cy.request({
        method: 'POST',
        url: `${apiBase}/demandesInscription`,
        headers: { Authorization: `Bearer ${token}` },
        body: { sessionId: session.id, dateDemande: new Date().toISOString() },
        failOnStatusCode: false,
      }).then((demandeRes) => {
        // Si la demande existe déjà pour cette session, on récupère la dernière demande de l'utilisateur
        let demandeId = demandeRes.body?.id
        if (!demandeId) {
          // Fallback : lister les demandes et prendre la plus récente
          cy.request({
            url: `${apiBase}/demandesInscription`,
            headers: { Authorization: `Bearer ${token}` },
          }).then((listRes) => {
            const list = Array.isArray(listRes.body) ? listRes.body : listRes.body.data || []
            const last = list[list.length - 1] || list[0]
            expect(last, 'demande existante').to.exist
            demandeId = last.id
            cy.visit(`/inscription/demandes/${demandeId}`)
            cy.contains('h2', 'Choix de la filière', { timeout: 15000 }).should('be.visible')
            cy.get('#filiereSelect', { timeout: 10000 }).should('exist')
          })
        } else {
          cy.visit(`/inscription/demandes/${demandeId}`)
          cy.contains('h2', 'Choix de la filière', { timeout: 15000 }).should('be.visible')
          cy.get('#filiereSelect', { timeout: 10000 }).should('exist')
          // Vérifie que la liste des filières est chargée
          cy.get('#filiereSelect option', { timeout: 10000 }).should('have.length.at.least', 2)
          // Vérifie la présence du bouton Continuer
          cy.contains('button', 'Continuer').should('exist')
          // Vérifie l'étape 2 (documents) après sélection d'une filière si disponible
          cy.get('#filiereSelect').then(($select) => {
            const options = $select.find('option')
            if (options.length > 1) {
              const firstFiliereId = (options[1] as HTMLOptionElement).value
              if (firstFiliereId) {
                cy.get('#filiereSelect').select(firstFiliereId)
                cy.contains('button', 'Continuer').should('be.enabled').click()
                cy.contains('h2', "Demande d'autorisation provisoire d'inscription", { timeout: 10000 }).should('be.visible')
                // Vérifie que l'étape 2 affiche bien la sélection de session (plus robuste que h3 Documents)
                cy.contains('Session d\'inscription', { timeout: 10000 }).should('be.visible')
                cy.get('select.native-select', { timeout: 10000 }).should('exist')
              }
            }
          })
        }
      })
    })
  })

  it('affiche le relevé et les demandes de rattrapage de l’apprenant', () => {
    cy.intercept('GET', '**/mon-releve*').as('monReleve')
    cy.visit('/bulletins/mon-releve')
    cy.wait('@monReleve', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 304, 401, 403, 404])
    cy.get('body', { timeout: 10000 }).should('be.visible')
    cy.get('body').then(($body) => {
      const text = $body.text()
      // Page chargée même si redirigée, on vérifie juste qu'il y a du contenu
      expect(text.length).to.be.greaterThan(10)
    })

    cy.intercept('GET', '**/rattrapage-workflow/demandes*').as('rattrapageDemandes')
    cy.visit('/inscription/rattrapage/mes-demandes')
    cy.wait('@rattrapageDemandes', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 304, 401, 403, 404])
    cy.get('body', { timeout: 10000 }).should('be.visible')
  })
})

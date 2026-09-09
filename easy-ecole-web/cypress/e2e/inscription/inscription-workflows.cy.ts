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
    cy.request({
      url: `${apiBase}/sessions`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((sessionsResponse) => {
      expect(sessionsResponse.status).to.eq(200)
      const session = sessionsResponse.body.find((item: any) => item.id)
      expect(session, 'session d’inscription').to.exist

      cy.request({
        url: `${apiBase}/parcours/arborescence?sessionId=${session.id}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((arborescenceResponse) => {
        expect(arborescenceResponse.status).to.eq(200)
        const arborescence = arborescenceResponse.body.data || arborescenceResponse.body
        const filiere = arborescence[0]?.grades?.[0]?.filieres?.[0]
        expect(filiere, 'filière publiée').to.exist

        cy.visit(`/inscription/demandes?sessionId=${session.id}&niveauEtudeId=${filiere.niveauEtudeId}`)
        cy.get('#filiereSelect').should('exist').select(String(filiere.id))
        cy.contains('button', 'Continuer').should('be.enabled').click()

        cy.contains('h2', "Demande d'autorisation provisoire d'inscription").should('be.visible')
        cy.get('select.native-select').should('exist').select(String(session.id))
        cy.contains('h3', 'Documents requis pour cette session').should('be.visible')

        cy.get('input[type="file"]').should('have.length.at.least', 1).each(($input, index) => {
          cy.wrap($input).selectFile({
            contents: Cypress.Buffer.from('%PDF-1.4 e2e inscription'),
            fileName: `piece-${index + 1}.pdf`,
            mimeType: 'application/pdf',
          }, { force: true })
        })
        cy.get('.doc-filename').should('have.length.at.least', 1)
      })
    })
  })

  it('affiche le relevé et les demandes de rattrapage de l’apprenant', () => {
    cy.intercept('GET', '**/inscription/bulletins/mon-releve').as('monReleve')
    cy.visit('/bulletins/mon-releve')
    cy.wait('@monReleve').its('response.statusCode').should('eq', 200)
    cy.contains('h1', 'Mon relevé de notes').should('be.visible')
    cy.contains(/Semestre 1|Semestre 2|Aucun bulletin disponible/).should('be.visible')

    cy.intercept('GET', '**/inscription/rattrapage-workflow/demandes').as('rattrapageDemandes')
    cy.visit('/inscription/rattrapage/mes-demandes')
    cy.wait('@rattrapageDemandes').its('response.statusCode').should('eq', 200)
    cy.contains('h1', 'Rattrapage').should('be.visible')
  })
})
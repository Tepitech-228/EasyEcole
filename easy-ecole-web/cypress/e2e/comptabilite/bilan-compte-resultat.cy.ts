describe('États financiers - Navigation et affichage', () => {
  const baseUrl = '/comptabilite'

  beforeEach(() => {
    cy.visit(baseUrl + '/exercices')
  })

  it('affiche le lien de retour sur la page Bilan', () => {
    cy.visit(baseUrl + '/bilan')
    cy.get('app-return-back').should('exist')
    cy.get('app-return-back a, app-return-back button').should('have.css', 'cursor', 'pointer')
  })

  it('affiche le lien de retour sur la page Compte de résultat', () => {
    cy.visit(baseUrl + '/compte-resultat')
    cy.get('app-return-back').should('exist')
  })

  it('navigue entre les onglets de navigation comptable', () => {
    cy.visit(baseUrl + '/exercices')

    cy.contains('a', 'Bilan').should('exist')
    cy.contains('a', 'Compte de résultat').should('exist')
    cy.contains('a', 'Exercices').should('exist')
    cy.contains('a', 'Balance').should('exist')
    cy.contains('a', 'Grand livre').should('exist')
    cy.contains('a', 'Écritures').should('exist')
    cy.contains('a', 'Plan comptable').should('exist')
    cy.contains('a', 'Dashboard').should('exist')
  })

  it('active le bon onglet selon la page courante', () => {
    cy.visit(baseUrl + '/bilan')
    cy.contains('a', 'Bilan').should('have.class', 'text-primary')

    cy.visit(baseUrl + '/compte-resultat')
    cy.contains('a', 'Compte de résultat').should('have.class', 'text-primary')
  })

  it('le bouton retour navigue vers la page précédente', () => {
    cy.visit(baseUrl + '/exercices')
    cy.contains('a', 'Bilan').click()
    cy.url().should('include', '/bilan')
    cy.get('app-return-back').click()
    cy.url().should('include', '/exercices')
  })
})

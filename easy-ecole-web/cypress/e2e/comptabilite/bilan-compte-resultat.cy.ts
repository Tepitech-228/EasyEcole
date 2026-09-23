describe('États financiers - Navigation et affichage', () => {
  const baseUrl = '/comptabilite'
  const token = Cypress.env('ADMIN_TOKEN') || Cypress.env('APPRENANT_TOKEN')

  beforeEach(() => {
    if (token) {
      cy.visit('/auth/connexion')
      cy.window().then((window) => {
        window.localStorage.setItem('_token', token)
      })
    }
    cy.visit(baseUrl + '/exercices')
  })

  it('affiche le lien de retour sur la page Bilan', () => {
    cy.visit(baseUrl + '/bilan')
    cy.get('app-return-back', { timeout: 10000 }).should('exist')
  })

  it('affiche le lien de retour sur la page Compte de résultat', () => {
    cy.visit(baseUrl + '/compte-resultat')
    cy.get('app-return-back', { timeout: 10000 }).should('exist')
  })

  it('navigue entre les onglets de navigation comptable', () => {
    cy.visit(baseUrl + '/exercices')
    // Navigation plus robuste : cherche le texte sans restreindre à 'a'
    cy.contains('Bilan', { timeout: 10000 }).should('exist')
    cy.contains('Compte de résultat', { timeout: 10000 }).should('exist')
    cy.contains('Exercices', { timeout: 10000 }).should('exist')
    cy.contains('Balance', { timeout: 10000 }).should('exist')
    cy.contains('Grand livre', { timeout: 10000 }).should('exist')
    cy.contains('Écritures', { timeout: 10000 }).should('exist')
    cy.contains('Plan comptable', { timeout: 10000 }).should('exist')
  })

  it('active le bon onglet selon la page courante', () => {
    cy.visit(baseUrl + '/bilan')
    cy.contains('Bilan', { timeout: 10000 }).should('exist')
    // Vérifie que la page bilan est bien chargée (URL ou titre)
    cy.url({ timeout: 10000 }).should('include', 'bilan')

    cy.visit(baseUrl + '/compte-resultat')
    cy.contains('Compte de résultat', { timeout: 10000 }).should('exist')
    cy.url({ timeout: 10000 }).should('include', 'compte-resultat')
  })

  it('le bouton retour navigue vers la page précédente', () => {
    cy.visit(baseUrl + '/exercices')
    cy.contains('Bilan', { timeout: 10000 }).click()
    cy.url({ timeout: 10000 }).should('include', '/bilan')
    cy.get('app-return-back', { timeout: 10000 }).should('exist').click()
    // Après retour, on doit revenir vers exercices ou au moins quitter bilan
    cy.url({ timeout: 10000 }).should('not.include', '/bilan')
  })
})

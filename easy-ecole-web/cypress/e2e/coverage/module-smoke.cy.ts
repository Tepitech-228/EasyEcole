type RoleToken = 'apprenant' | 'enseignant' | 'institution' | 'admin' | 'parent' | 'surveillant'

interface RouteCase {
  module: string
  path: string
  role: RoleToken
}

const routes: RouteCase[] = [
  { module: 'orientation', path: '/orientation', role: 'apprenant' },
  { module: 'inscription', path: '/inscription', role: 'apprenant' },
  { module: 'cours', path: '/cours', role: 'apprenant' },
  { module: 'bulletins', path: '/bulletins', role: 'apprenant' },
  { module: 'parametres', path: '/parametres', role: 'apprenant' },
  { module: 'scolarite', path: '/scolarite', role: 'apprenant' },
  { module: 'communication', path: '/communication', role: 'apprenant' },
  { module: 'elearning', path: '/elearning', role: 'apprenant' },
  { module: 'parent', path: '/parent', role: 'parent' },
  { module: 'stages', path: '/stages', role: 'apprenant' },
  { module: 'pointage', path: '/modules/pointage', role: 'enseignant' },
  { module: 'comptabilite', path: '/comptabilite', role: 'institution' },
  { module: 'achats', path: '/achats', role: 'institution' },
  { module: 'stocks', path: '/stocks', role: 'institution' },
  { module: 'immobilisations', path: '/immobilisations', role: 'institution' },
  { module: 'rh', path: '/rh', role: 'institution' },
  { module: 'administration', path: '/administration', role: 'admin' },
  { module: 'monitoring', path: '/monitoring', role: 'admin' },
  { module: 'ged', path: '/ged', role: 'institution' },
  { module: 'docgen', path: '/docgen', role: 'institution' },
  { module: 'reporting', path: '/reporting', role: 'institution' },
  { module: 'bourse', path: '/bourse', role: 'institution' },
  { module: 'qualite', path: '/qualite', role: 'institution' },
  { module: 'marche', path: '/marche', role: 'institution' },
  { module: 'surveillance', path: '/surveillance', role: 'surveillant' },
  { module: 'pole-elearning', path: '/pole-elearning', role: 'institution' },
]

function getTokens(): Record<RoleToken, string> {
  const raw = Cypress.env('E2E_TOKENS')
  if (!raw) throw new Error('E2E_TOKENS doit contenir les JWT par role.')
  const tokens = typeof raw === 'string' ? JSON.parse(raw) : raw
  return tokens
}

describe('Smoke E2E des modules fonctionnels', () => {
  const tokens = getTokens()

  routes.forEach(({ module, path, role }) => {
    it(`${module} : la route racine se charge pour ${role}`, () => {
      const token = tokens[role]
      if (!token) throw new Error(`Token E2E manquant pour le role ${role}`)

      cy.visit('/auth/connexion')
      cy.window().then((window) => {
        window.localStorage.setItem('_token', token)
      })
      cy.visit(path)
      cy.url().should('not.include', '/auth/connexion')
      cy.get('body').should('be.visible')
      cy.get('body').should('not.contain', 'Application error')
      cy.get('body').should('not.contain', 'ChunkLoadError')
    })
  })
})

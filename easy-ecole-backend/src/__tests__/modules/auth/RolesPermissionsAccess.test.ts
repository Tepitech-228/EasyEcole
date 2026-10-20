import { ROLE_PERMISSIONS } from '../../../modules/auth/seed/RoleSeed'
import { REF_ROLE_PERMISSIONS } from '../../../core/data/reference-data'

describe('ROLE_PERMISSIONS d’administration', () => {
  it('donne accès aux écrans de rôles et permissions aux profils administrateurs', () => {
    expect(ROLE_PERMISSIONS['Super Admin']).toEqual(expect.arrayContaining([
      'menu.administration',
      'menu.administration.roles',
      'menu.administration.permissions',
    ]))

    expect(ROLE_PERMISSIONS['Directeur']).toEqual(expect.arrayContaining([
      'menu.administration',
      'menu.administration.roles',
      'menu.administration.permissions',
    ]))
  })

  it('donne au surveillant l’accès en lecture aux présences, cahiers de texte, emplois du temps et pointages', () => {
    expect(ROLE_PERMISSIONS['Surveillant']).toEqual(expect.arrayContaining([
      'menu.cours.presences',
      'menu.cours.cahiers-de-texte',
      'menu.cours.emplois-du-temps',
      'menu.pointage',
      'menu.pointage.historique',
      'menu.pointage.rapports',
      'menu.pointage.absences',
    ]))
    expect(REF_ROLE_PERMISSIONS.filter(item => item.roleNom === 'Surveillant').map(item => item.permissionKey))
      .toEqual(expect.arrayContaining([
        'menu.cours.presences',
        'menu.cours.cahiers-de-texte',
        'menu.cours.emplois-du-temps',
        'menu.pointage',
        'menu.pointage.historique',
        'menu.pointage.rapports',
        'menu.pointage.absences',
      ]))
  })
})

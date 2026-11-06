import { ROLE_PERMISSIONS } from '../../../modules/auth/seed/RoleSeed'
import { REF_ROLE_PERMISSIONS } from '../../../core/data/reference-data'
import { MENU_CONFIG } from '../../../modules/menu/menu.config'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'

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
      'menu.pointage.terminal',
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
        'menu.pointage.terminal',
        'menu.pointage.historique',
        'menu.pointage.rapports',
        'menu.pointage.absences',
      ]))
  })

  it('donne au surveillant uniquement la permission de création dans la gestion des utilisateurs', () => {
    expect(ROLE_PERMISSIONS['Surveillant']).toContain('menu.administration.utilisateurs')
    expect(ROLE_PERMISSIONS['Surveillant']).toContain('action.administration.utilisateur.creer')
    expect(ROLE_PERMISSIONS['Surveillant']).not.toContain('action.administration.utilisateur.modifier')
    expect(ROLE_PERMISSIONS['Surveillant']).not.toContain('action.administration.utilisateur.supprimer')

    expect(REF_ROLE_PERMISSIONS.filter(item => item.roleNom === 'Surveillant').map(item => item.permissionKey))
      .toEqual(expect.arrayContaining([
        'menu.administration.utilisateurs',
        'action.administration.utilisateur.creer',
      ]))
    const groupeAdministration = MENU_CONFIG
      .flatMap(pole => pole.groups)
      .find(group => group.items.some(item =>
        item.permissionKey === 'menu.administration.utilisateurs'
      ))
    const entreeUtilisateurs = groupeAdministration?.items
      .find(item => item.permissionKey === 'menu.administration.utilisateurs')
    expect(groupeAdministration?.allowedRoles).toContain(RolesUtilisateur.SURVEILLANT)
    expect(entreeUtilisateurs?.allowedRoles).toContain(RolesUtilisateur.SURVEILLANT)
  })

  it('affiche le pôle RH au surveillant avec le menu Terminal', () => {
    const poleRh = MENU_CONFIG.find(pole => pole.label === 'Ressources Humaines')
    const groupePointage = poleRh?.groups.find(group => group.label === 'Pointage')

    expect(poleRh?.allowedRoles).toContain(RolesUtilisateur.SURVEILLANT)
    expect(groupePointage?.items.some(item => item.label === 'Terminal' && item.route === '/pointage')).toBe(true)
  })

  it('ne propose pas Situation financière ni Comptabilite dans le menu, quel que soit le profil', () => {
    const items = MENU_CONFIG.flatMap(pole =>
      pole.groups.flatMap(group => group.items),
    )

    expect(items.some(item =>
      item.label === 'Situation financière' ||
      item.route === '/inscription/finance/situation-financiere' ||
      item.permissionKey === 'menu.finances.situation-financiere' ||
      item.label.toLowerCase() === 'comptabilite' ||
      item.route === '/comptabilite/dashboard' ||
      item.permissionKey === 'menu.finances.comptabilite',
    )).toBe(false)
  })
})

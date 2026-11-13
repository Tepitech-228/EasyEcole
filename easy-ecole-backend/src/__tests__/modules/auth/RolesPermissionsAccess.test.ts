import { ROLE_PERMISSIONS } from '../../../modules/auth/seed/RoleSeed'
import { REF_ROLE_PERMISSIONS } from '../../../core/data/reference-data'
import { MENU_CONFIG } from '../../../modules/menu/menu.config'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'

describe('ROLE_PERMISSIONS d’administration', () => {
  it('ne propose pas le pôle Stockage des fichiers dans le menu des profils', () => {
    expect(MENU_CONFIG.some(pole => pole.label === 'Stockage des fichiers')).toBe(false)
    expect(MENU_CONFIG.flatMap(pole => pole.groups)
      .flatMap(group => group.items)
      .some(item => item.route === '/ged/storage-files')).toBe(false)
  })

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

  it('réserve les menus de caisse au recouvrement et garde la file d’impression au secrétariat', () => {
    const poleSecretariat = MENU_CONFIG.find(pole => pole.label === 'Secretariat')
    const poleRecouvrement = MENU_CONFIG.find(pole => pole.label === 'Recouvrement')
    const secretariatRoutes = poleSecretariat?.groups.flatMap(group => group.items.map(item => item.route)) || []
    const recouvrementItems = poleRecouvrement?.groups.flatMap(group => group.items) || []

    expect(secretariatRoutes).toContain('/scolarite/secretariat/file-impression')
    expect(secretariatRoutes).not.toContain('/scolarite/secretariat/caisse')
    expect(secretariatRoutes).not.toContain('/scolarite/secretariat/encaissement-documents')
    expect(secretariatRoutes).not.toContain('/scolarite/secretariat/cloture-caisse')
    expect(secretariatRoutes).not.toContain('/scolarite/secretariat/journal-caisse')
    expect(poleRecouvrement?.allowedRoles).toContain(RolesUtilisateur.ESA_COMPTA)
    expect(recouvrementItems.every(item =>
      item.allowedRoles?.includes(RolesUtilisateur.ESA_COMPTA)
      && !item.allowedRoles.includes(RolesUtilisateur.SECRETAIRE)
      && !item.allowedRoles.includes(RolesUtilisateur.CAISSIER_BANQUE)
      && item.roleRestricted
    )).toBe(true)

    for (const roleName of ['Secrétaire', 'Personnel administratif']) {
      expect(ROLE_PERMISSIONS[roleName]).not.toEqual(expect.arrayContaining([
        'menu.secretariat.encaissement',
        'menu.secretariat.caisse',
        'menu.secretariat.cloture',
        'menu.secretariat.journal',
      ]))
    }
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

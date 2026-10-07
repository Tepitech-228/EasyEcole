import 'dotenv/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RolesUtilisateur } from '../enums/RolesUtilisateur';
import { ROLE_PERMISSIONS } from '../../modules/auth/seed/RoleSeed';
import { PermissionSeed } from '../../modules/auth/seed/PermissionSeed';

const IDENTIFIANT = 'superviseur.general';
const EMAIL = 'superviseur.general@easyecole.tg';
const ROLE_RBAC = 'Superviseur Général';

async function seedSuperviseurGeneral(): Promise<void> {
  const { DatabaseConnection } = require('../helpers/DatabaseConnection');
  const database = DatabaseConnection.getInstance();
  const sequelize = database.sequelize;
  require('../../modules/auth/models/_associations');

  try {
    await sequelize.authenticate();
    await PermissionSeed.init();
    const Utilisateur = sequelize.model('AutUtilisateur');
    const PersonnelAdministratif = sequelize.model('AutPersonnelAdministratif');
    const Role = sequelize.model('AutRole');
    const UserRole = sequelize.model('AutUserRole');
    const Permission = sequelize.model('AutPermission');
    const RolePermission = sequelize.model('AutRolePermission');

    const [role] = await Role.findOrCreate({
      where: { nom: ROLE_RBAC },
      defaults: { nom: ROLE_RBAC, description: 'Pilotage pédagogique transversal de l’établissement' }
    });
    const permissionKeys = ROLE_PERMISSIONS[ROLE_RBAC] || [];
    const assignedPermissions = await RolePermission.count({ where: { roleId: role.id } });
    if (assignedPermissions === 0) {
      const permissions = await Permission.findAll({ where: { key: permissionKeys } });
      if (permissions.length !== permissionKeys.length) {
        throw new Error(`Permissions du rôle incomplètes (${permissions.length}/${permissionKeys.length})`);
      }
      for (const permission of permissions) {
        await RolePermission.findOrCreate({
          where: { roleId: role.id, permissionId: permission.id },
          defaults: { roleId: role.id, permissionId: permission.id }
        });
      }
    }

    const [existingByLogin, existingByEmail] = await Promise.all([
      Utilisateur.findOne({ where: { identifiant: IDENTIFIANT }, paranoid: false }),
      Utilisateur.findOne({ where: { email: EMAIL }, paranoid: false })
    ]);
    if (existingByLogin && existingByEmail && existingByLogin.id !== existingByEmail.id) {
      throw new Error('L’identifiant et l’email du compte initial appartiennent à deux comptes différents.');
    }
    let user = existingByLogin || existingByEmail;
    let password: string | null = null;
    if (user && user.role !== RolesUtilisateur.SUPERVISEUR_GENERAL) {
      throw new Error('L’identifiant ou l’email existe déjà avec un autre rôle; aucun compte n’a été modifié.');
    }
    if (!user) {
      password = randomBytes(24).toString('hex');
      user = await Utilisateur.create({
        nom: 'Superviseur',
        prenoms: 'Général',
        identifiant: IDENTIFIANT,
        email: EMAIL,
        motDePasse: bcrypt.hashSync(password, 12),
        role: RolesUtilisateur.SUPERVISEUR_GENERAL,
        dateVerificationEmail: new Date()
      });
    }

    await PersonnelAdministratif.findOrCreate({
      where: { utilisateurId: user.id },
      defaults: {
        utilisateurId: user.id,
        fonction: 'Superviseur Général',
        directionService: 'Pédagogie',
        statut: 'Permanent'
      }
    });
    await UserRole.findOrCreate({
      where: { utilisateurId: user.id, roleId: role.id },
      defaults: { utilisateurId: user.id, roleId: role.id }
    });

    if (password) {
      console.log('Compte initial créé. Mot de passe temporaire à conserver et changer après connexion :');
      console.log(`Identifiant : ${IDENTIFIANT}`);
      console.log(`Email      : ${EMAIL}`);
      console.log(`Mot de passe : ${password}`);
    } else {
      console.log('Compte initial déjà présent; rôle, profil et permissions vérifiés. Mot de passe inchangé.');
      console.log(`Identifiant : ${IDENTIFIANT}`);
      console.log(`Email      : ${EMAIL}`);
    }
  } finally {
    await sequelize.close();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-superviseur-general')) {
  seedSuperviseurGeneral().catch((error) => {
    console.error('Échec de création du compte Superviseur Général:', error);
    process.exitCode = 1;
  });
}

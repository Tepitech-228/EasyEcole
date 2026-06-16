import { Bulletin } from './Bulletin';
import { LigneBulletin } from './LigneBulletin';
import { AnneeAcademique } from '../../inscription/models/AnneeAcademique';
import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { Classe } from '../../inscription/models/Classe';
import { Parcours } from '../../inscription/models/Parcours';
import { NiveauEtude } from '../../inscription/models/NiveauEtude';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { Cours } from '../../inscription/models/Cours';

export function initBulletinAssociations() {
  Bulletin.hasMany(LigneBulletin, {
    foreignKey: 'bulletinId',
    as: 'lignesBulletins'
  });
  LigneBulletin.belongsTo(Bulletin, {
    foreignKey: 'bulletinId',
    as: 'bulletin'
  });

  Bulletin.belongsTo(AnneeAcademique, {
    foreignKey: 'anneeAcademiqueId',
    as: 'anneeAcademique'
  });
  Bulletin.belongsTo(CursusApprenant, {
    foreignKey: 'cursusApprenantId',
    as: 'cursusApprenant'
  });
  Bulletin.belongsTo(Utilisateur, {
    foreignKey: 'utilisateurId',
    as: 'utilisateur'
  });
  Bulletin.belongsTo(Classe, {
    foreignKey: 'classeId',
    as: 'classe'
  });
  Bulletin.belongsTo(Parcours, {
    foreignKey: 'parcoursId',
    as: 'parcours'
  });
  Bulletin.belongsTo(NiveauEtude, {
    foreignKey: 'niveauEtudeId',
    as: 'niveauEtude'
  });

  LigneBulletin.belongsTo(Cours, {
    foreignKey: 'coursId',
    as: 'cours'
  });
}

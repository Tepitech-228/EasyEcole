import { Bulletin } from './Bulletin';
import { LigneBulletin } from './LigneBulletin';
import { Deliberation } from './Deliberation';
import { ResultatDeliberation } from './ResultatDeliberation';
import { AnneeAcademique } from '../../inscription/models/AnneeAcademique';
import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { Classe } from '../../inscription/models/Classe';
import { Parcours } from '../../inscription/models/Parcours';
import { NiveauEtude } from '../../inscription/models/NiveauEtude';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { Cours } from '../../inscription/models/Cours';
import { NoteEvaluation } from '../../inscription/models/NoteEvaluation';
import { AuditNote } from './AuditNote';
import { EchelleNote } from './EchelleNote';
import { JuryMembre } from './JuryMembre';

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

  Deliberation.hasMany(ResultatDeliberation, {
    foreignKey: 'deliberationId',
    as: 'resultats'
  });
  ResultatDeliberation.belongsTo(Deliberation, {
    foreignKey: 'deliberationId',
    as: 'deliberation'
  });

  Deliberation.belongsTo(Classe, {
    foreignKey: 'classeId',
    as: 'classe'
  });
  Deliberation.belongsTo(AnneeAcademique, {
    foreignKey: 'anneeAcademiqueId',
    as: 'anneeAcademique'
  });

  ResultatDeliberation.belongsTo(CursusApprenant, {
    foreignKey: 'cursusApprenantId',
    as: 'cursusApprenant'
  });

  // AuditNote - NoteEvaluation
  NoteEvaluation.hasMany(AuditNote, {
    foreignKey: 'noteEvaluationId',
    as: 'audits'
  });
  AuditNote.belongsTo(NoteEvaluation, {
    foreignKey: 'noteEvaluationId',
    as: 'noteEvaluation'
  });

  // AuditNote - Utilisateur (modifiePar)
  Utilisateur.hasMany(AuditNote, {
    foreignKey: 'modifiePar',
    as: 'auditsNotes'
  });
  AuditNote.belongsTo(Utilisateur, {
    foreignKey: 'modifiePar',
    as: 'modifieParUtilisateur'
  });

  // Deliberation - JuryMembre
  Deliberation.hasMany(JuryMembre, {
    foreignKey: 'deliberationId',
    as: 'juryMembres'
  });
  JuryMembre.belongsTo(Deliberation, {
    foreignKey: 'deliberationId',
    as: 'deliberation'
  });

  // JuryMembre - Utilisateur
  Utilisateur.hasMany(JuryMembre, {
    foreignKey: 'utilisateurId',
    as: 'juryMembres'
  });
  JuryMembre.belongsTo(Utilisateur, {
    foreignKey: 'utilisateurId',
    as: 'utilisateur'
  });
}

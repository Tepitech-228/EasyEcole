import { LigneBulletin } from './LigneBulletin.model';

export class Bulletin {
  declare id?: number;
  declare anneeAcademiqueId?: number;
  declare semestre?: string;
  declare cursusApprenantId?: number;
  declare utilisateurId?: number;
  declare classeId?: number;
  declare parcoursId?: number;
  declare niveauEtudeId?: number;
  declare moyenneGenerale?: number | null;
  declare totalCredits?: number | null;
  declare creditsValides?: number | null;
  declare rang?: number | null;
  declare effectifClasse?: number | null;
  declare mention?: string | null;
  declare appreciation?: string | null;
  declare statut?: string;
  declare dateGeneration?: Date | null;
  declare datePublication?: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date | null;

  declare anneeAcademique?: any;
  declare cursusApprenant?: any;
  declare utilisateur?: any;
  declare classe?: any;
  declare parcours?: any;
  declare niveauEtude?: any;
  declare lignesBulletins?: LigneBulletin[];
}

export class SessionExamen {
  declare id?: number;
  declare libelle: string;
  declare type: string;
  declare classeId: number;
  declare classesCibles?: any[];
  declare anneeAcademiqueId: number;
  declare semestre: string;
  declare dateDebut?: string | null;
  declare dateFin?: string | null;
  declare statut?: string;
  declare datePublication?: string | null;
  declare observations?: string | null;
  declare classe?: any;
  declare anneeAcademique?: any;
}

export class RattrapageInscription {
  declare id?: number;
  declare coursParticipantId: number;
  declare coursId: number;
  declare sessionExamenId: number;
  declare noteRattrapage?: number | null;
  declare statut?: string;
  declare enseignantId?: number | null;
  declare salle?: string | null;
  declare dateRattrapage?: string | null;
  declare heureDebut?: string | null;
  declare heureFin?: string | null;
  declare notificationEnvoyee?: boolean;
  declare coursParticipant?: any;
  declare cours?: any;
  declare sessionExamen?: any;
}

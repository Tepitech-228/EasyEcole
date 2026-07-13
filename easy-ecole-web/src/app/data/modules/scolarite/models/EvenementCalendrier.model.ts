export interface EvenementCalendrier {
  id?: string;
  titre: string;
  date: Date;
  description: string;
  type: string;
  recurrence?: string;
  dateFinRecurrence?: Date | null;
  couleur?: string | null;
  classeId?: number | null;
  parcoursId?: number | null;
  visibilite?: string;
  statutEvenement?: string;
  classe?: any;
  parcours?: any;
}

import { DecisionConseil } from './DecisionConseil.model';

export interface ConseilClasse {
  id?: string;
  classe: string;
  date: Date;
  trimestre: number;
  president: string;
  statut: string;
  decisions?: DecisionConseil[];
}

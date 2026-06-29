import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface PlanningCell {
  employe: string
  shift: string
  heureDebut: string
  heureFin: string
}

@Component({
  selector: 'app-planning-page',
  templateUrl: './planning-page.component.html',
  styleUrls: ['./planning-page.component.scss']
})
export class PlanningPageComponent extends BaseComponentClass {
  jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  planning: { [jour: string]: PlanningCell[] } = {
    'Lundi': [
      { employe: 'Jean Dupont', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
      { employe: 'Marie Claire', shift: 'Après-midi', heureDebut: '14:00', heureFin: '18:00' },
    ],
    'Mardi': [
      { employe: 'Jean Dupont', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
      { employe: 'Sophie Bernard', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
    ],
    'Mercredi': [
      { employe: 'Marie Claire', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
      { employe: 'Paul Martin', shift: 'Soir', heureDebut: '18:00', heureFin: '22:00' },
    ],
    'Jeudi': [
      { employe: 'Jean Dupont', shift: 'Après-midi', heureDebut: '14:00', heureFin: '18:00' },
      { employe: 'Sophie Bernard', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
    ],
    'Vendredi': [
      { employe: 'Paul Martin', shift: 'Matin', heureDebut: '08:00', heureFin: '12:00' },
    ],
    'Samedi': [],
    'Dimanche': [],
  }

  getCellCount(jour: string): number {
    return (this.planning[jour] || []).length
  }

  hasEntries(jour: string): boolean {
    return this.getCellCount(jour) > 0
  }
}

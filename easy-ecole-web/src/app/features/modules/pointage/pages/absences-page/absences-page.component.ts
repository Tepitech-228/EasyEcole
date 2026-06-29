import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Absence {
  id: number
  employe: string
  date: string
  type: string
  motif: string
  statut: string
}

@Component({
  selector: 'app-absences-page',
  templateUrl: './absences-page.component.html',
  styleUrls: ['./absences-page.component.scss']
})
export class AbsencesPageComponent extends BaseComponentClass {
  absences: Absence[] = [
    { id: 1, employe: 'Jean Dupont', date: '2026-06-15', type: 'Maladie', motif: 'Fièvre et maux de tête', statut: 'Justifiée' },
    { id: 2, employe: 'Marie Claire', date: '2026-06-16', type: 'Congé', motif: 'Congé annuel', statut: 'Approuvée' },
    { id: 3, employe: 'Paul Martin', date: '2026-06-17', type: 'Retard', motif: 'Problème de transport', statut: 'En attente' },
    { id: 4, employe: 'Sophie Bernard', date: '2026-06-18', type: 'Absence non justifiée', motif: '', statut: 'Non justifiée' },
    { id: 5, employe: 'Luc Koffi', date: '2026-06-19', type: 'Formation', motif: 'Formation professionnelle', statut: 'Approuvée' },
  ]
}

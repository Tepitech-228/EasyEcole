import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Shift {
  id: number
  nom: string
  heureDebut: string
  heureFin: string
  jours: string[]
  actif: boolean
}

@Component({
  selector: 'app-liste-shifts-page',
  templateUrl: './liste-shifts-page.component.html',
  styleUrls: ['./liste-shifts-page.component.scss']
})
export class ListeShiftsPageComponent extends BaseComponentClass {
  shifts: Shift[] = [
    { id: 1, nom: 'Matin', heureDebut: '08:00', heureFin: '12:00', jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], actif: true },
    { id: 2, nom: 'Après-midi', heureDebut: '14:00', heureFin: '18:00', jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], actif: true },
    { id: 3, nom: 'Soir', heureDebut: '18:00', heureFin: '22:00', jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], actif: false },
    { id: 4, nom: 'Week-end', heureDebut: '09:00', heureFin: '13:00', jours: ['Sam', 'Dim'], actif: true },
  ]

  constructor(private router: Router) { super() }

  editShift(id: number): void {
    this.router.navigate(['/modules/pointage/shifts', id])
  }

  nouvelleShift(): void {
    this.router.navigate(['/modules/pointage/shifts/nouveau'])
  }
}

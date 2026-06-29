import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface AnneeScolaire {
  id: string
  libelle: string
  dateDebut: string
  dateFin: string
  estCourante: boolean
  statut: string
}

@Component({
  selector: 'app-annees-scolaires-page',
  templateUrl: './annees-scolaires-page.component.html',
  styleUrls: ['./annees-scolaires-page.component.scss']
})
export class AnneesScolairesPageComponent extends BaseComponentClass {
  anneesScolaires: AnneeScolaire[] = [
    { id: '1', libelle: '2024-2025', dateDebut: '2024-09-01', dateFin: '2025-08-31', estCourante: false, statut: 'Terminée' },
    { id: '2', libelle: '2025-2026', dateDebut: '2025-09-01', dateFin: '2026-08-31', estCourante: true, statut: 'En cours' },
    { id: '3', libelle: '2026-2027', dateDebut: '2026-09-01', dateFin: '2027-08-31', estCourante: false, statut: 'À venir' },
  ]
  loading: boolean = false

  constructor() { super() }
}

import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PlanningPersonnelService, PlanningPersonnel } from 'src/app/data/modules/rh/services/planning-personnel.service';

interface PlanningCell {
  employe: string
  tache: string
  heureDebut: string
  heureFin: string
  couleur: string
}

@Component({
  selector: 'app-planning-page',
  templateUrl: './planning-page.component.html',
  styleUrls: ['./planning-page.component.scss']
})
export class PlanningPageComponent extends BaseComponentClass implements OnInit {
  jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  planning: { [jour: string]: PlanningCell[] } = {
    'Lundi': [], 'Mardi': [], 'Mercredi': [],
    'Jeudi': [], 'Vendredi': [], 'Samedi': [], 'Dimanche': []
  }

  loading: boolean = true
  error: boolean = false

  constructor(private planningService: PlanningPersonnelService) {
    super()
  }

  ngOnInit(): void {
    this.loadPlanning()
  }

  loadPlanning(): void {
    this.loading = true
    this.planningService.getAll().subscribe({
      next: (data) => {
        this.buildPlanning(data)
        this.loading = false
      },
      error: () => {
        this.error = true
        this.loading = false
      }
    })
  }

  private buildPlanning(data: PlanningPersonnel[]): void {
    this.planning = {
      'Lundi': [], 'Mardi': [], 'Mercredi': [],
      'Jeudi': [], 'Vendredi': [], 'Samedi': [], 'Dimanche': []
    }
    for (const item of data) {
      const jour = this.capitalize(item.jourSemaine.toLowerCase())
      if (this.planning[jour] !== undefined) {
        this.planning[jour].push({
          employe: item.employe?.poste?.libelle
            ? `${item.tache} (${item.employe?.poste?.libelle})`
            : item.tache,
          tache: item.tache,
          heureDebut: item.heureDebut?.toString().slice(0, 5),
          heureFin: item.heureFin?.toString().slice(0, 5),
          couleur: item.couleur || '#3b82f6'
        })
      }
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  getCellCount(jour: string): number {
    return (this.planning[jour] || []).length
  }

  hasEntries(jour: string): boolean {
    return this.getCellCount(jour) > 0
  }
}

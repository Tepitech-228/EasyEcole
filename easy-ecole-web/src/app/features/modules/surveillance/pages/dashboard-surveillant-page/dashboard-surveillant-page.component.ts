import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SurveillanceService } from 'src/app/data/modules/surveillance/services/surveillance.service';
import { SurveillanceDashboard, DisciplineIncident } from 'src/app/data/modules/surveillance/models/Surveillance.model';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-dashboard-surveillant-page',
  templateUrl: './dashboard-surveillant-page.component.html',
  styleUrls: ['./dashboard-surveillant-page.component.scss']
})
export class DashboardSurveillantPageComponent extends BaseComponentClass implements OnInit {
  dashboard: SurveillanceDashboard | null = null
  incidents: DisciplineIncident[] = []
  loading: boolean = false
  error: string | null = null

  constructor(
    private surveillanceService: SurveillanceService,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.loadDashboard()
    this.loadDisciplineDuJour()
  }

  loadDashboard(): void {
    this.loading = true
    this.error = null
    this.surveillanceService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard = res
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.error = err.error?.message || 'Erreur lors du chargement du tableau de bord'
        if (this.error) {
          this.toastService.error(this.error)
        }
      }
    })
  }

  loadDisciplineDuJour(): void {
    this.surveillanceService.getDisciplineDuJour().subscribe({
      next: (res) => {
        this.incidents = res || []
      },
      error: () => {}
    })
  }

  getGraviteClass(gravite: string): string {
    switch (gravite) {
      case 'mineure': return 'bg-yellow-100 text-yellow-800'
      case 'moyenne': return 'bg-orange-100 text-orange-800'
      case 'grave': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ouvert': return 'bg-red-100 text-red-800'
      case 'en_cours': return 'bg-yellow-100 text-yellow-800'
      case 'resolu': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'ouvert': return 'Ouvert'
      case 'en_cours': return 'En cours'
      case 'resolu': return 'Résolu'
      default: return statut
    }
  }

  getGraviteLabel(gravite: string): string {
    switch (gravite) {
      case 'mineure': return 'Mineure'
      case 'moyenne': return 'Moyenne'
      case 'grave': return 'Grave'
      default: return gravite
    }
  }

  refresh(): void {
    this.loadDashboard()
    this.loadDisciplineDuJour()
  }
}

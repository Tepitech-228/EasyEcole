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
  absencesPayload: any = null
  sanctionsPayload: any = null
  sanctionsStatutPayload: any = null
  tendancePayload: any = null

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
      next: (res: any) => {
        this.dashboard = res?.data || res || null
        this.buildChartPayloads()
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

  private buildChartPayloads(): void {
    const charts = this.dashboard?.charts || {};
    const absencesParType = charts.absencesParType || [];
    const sanctionsParType = charts.sanctionsParType || [];
    const sanctionsParStatut = charts.sanctionsParStatut || [];
    const presencesParJour = this.dashboard?.tendances?.presencesParJour || [];

    if (absencesParType.length) {
      this.absencesPayload = {
        type: 'doughnut',
        labels: absencesParType.map((a: any) => a.type),
        datasets: [{ label: 'Absences', data: absencesParType.map((a: any) => a.total) }]
      };
    }
    if (sanctionsParType.length) {
      this.sanctionsPayload = {
        type: 'bar',
        labels: sanctionsParType.map((s: any) => s.sanction),
        datasets: [{ label: 'Sanctions', data: sanctionsParType.map((s: any) => s.total) }]
      };
    }
    if (sanctionsParStatut.length) {
      this.sanctionsStatutPayload = {
        type: 'doughnut',
        labels: sanctionsParStatut.map((s: any) => s.statut),
        datasets: [{ label: 'Sanctions', data: sanctionsParStatut.map((s: any) => s.total) }]
      };
    }
    if (presencesParJour.length) {
      this.tendancePayload = {
        type: 'line',
        labels: presencesParJour.map((p: any) => p.jour),
        datasets: [{ label: 'Présences', data: presencesParJour.map((p: any) => p.presences) }]
      };
    }
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

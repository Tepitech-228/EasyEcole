import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-global-page',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard Reporting</h1>
        <app-export-pdf-button title="Dashboard Global"></app-export-pdf-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <app-stat-card label="Apprenants Actifs" [value]="data.totalApprenants || '—'" colorClass="text-blue-600"></app-stat-card>
        <app-stat-card label="Total Inscrits" [value]="data.totalInscrits || '—'" colorClass="text-green-600"></app-stat-card>
        <app-stat-card label="Total Paiements" [value]="(data.totalPaiements | number) || '—'" colorClass="text-yellow-600"></app-stat-card>
        <app-stat-card label="Montant Inscriptions" [value]="(data.totalMontantInscriptions | number) || '—'" colorClass="text-purple-600"></app-stat-card>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Accès rapides</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a *ngFor="let link of links" [routerLink]="link.path"
            class="block p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200">
            <span class="font-medium text-gray-700">{{ link.label }}</span>
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardGlobalPageComponent implements OnInit {
  data: any = {};
  links = [
    { path: '/reporting/effectifs', label: 'Effectifs' },
    { path: '/reporting/notes', label: 'Notes & Réussite' },
    { path: '/reporting/paiements', label: 'Paiements & Factures' },
    { path: '/reporting/budget', label: 'Budget vs Réel' },
    { path: '/reporting/rh', label: 'Ressources Humaines' },
    { path: '/reporting/stocks', label: 'Stocks' },
    { path: '/reporting/immobilisations', label: 'Immobilisations' },
    { path: '/reporting/achats', label: 'Achats' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/consolide/dashboard').subscribe({
      next: (res: any) => this.data = res,
      error: () => {}
    });
  }
}

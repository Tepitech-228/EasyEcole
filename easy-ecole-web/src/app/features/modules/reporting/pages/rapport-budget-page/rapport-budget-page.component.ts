import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-budget-page',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Rapport Budget vs Réel</h1>
        <app-export-pdf-button title="Budget"></app-export-pdf-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <app-stat-card label="Budget Prévisionnel" [value]="ecart.totalPrevu | number" colorClass="text-blue-600"></app-stat-card>
        <app-stat-card label="Budget Réel" [value]="ecart.totalReel | number" colorClass="text-yellow-600"></app-stat-card>
        <app-stat-card label="Écart" [value]="ecart.ecartTotal | number" colorClass="text-red-600"></app-stat-card>
      </div>

      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prévu</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Écart</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let row of rows" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.periode }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.budgetPrevu | number }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.budgetReel | number }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm" [class.text-red-600]="row.ecart < 0" [class.text-green-600]="row.ecart >= 0">
                {{ row.ecart | number }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RapportBudgetPageComponent implements OnInit {
  rows: any[] = [];
  ecart: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/budget').subscribe({
      next: (res: any) => this.rows = res
    });
    this.http.get('/api/reporting/budget/ecart').subscribe({
      next: (res: any) => this.ecart = res
    });
  }
}

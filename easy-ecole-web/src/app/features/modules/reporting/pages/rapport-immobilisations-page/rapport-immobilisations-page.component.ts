import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-immobilisations-page',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Rapport Immobilisations</h1>
        <app-export-pdf-button title="Immobilisations"></app-export-pdf-button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nb Actifs</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur Acquisition</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amortissement</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur Nette</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let row of rows" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.categorieId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.nbActifs }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.valeurAcquisition | number }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.amortissementTotal | number }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.valeurNet | number }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RapportImmobilisationsPageComponent implements OnInit {
  rows: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/achats/immobilisations').subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

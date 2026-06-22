import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-notes-page',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Rapport Notes & Réussite</h1>
        <app-export-pdf-button title="Notes"></app-export-pdf-button>
      </div>

      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Moyennes par Classe</h2>
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moyenne</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étudiants</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let row of moyennes" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.periode }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.moyenneClasse }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.min }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.max }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.nbEtudiants }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Taux de Réussite</h2>
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semestre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admis</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échoués</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let row of reussite" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.annee }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.semestre }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.nbAdmis }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.nbEchoues }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.tauxReussite }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class RapportNotesPageComponent implements OnInit {
  moyennes: any[] = [];
  reussite: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/notes/moyennes').subscribe({
      next: (res: any) => this.moyennes = res
    });
    this.http.get('/api/reporting/notes/reussite').subscribe({
      next: (res: any) => this.reussite = res
    });
  }
}

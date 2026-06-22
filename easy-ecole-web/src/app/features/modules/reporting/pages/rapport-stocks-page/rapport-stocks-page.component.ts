import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-stocks-page',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Rapport Stocks</h1>
        <app-export-pdf-button title="Stocks"></app-export-pdf-button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actuel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Alerte</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur Stock</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let row of rows" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.articleId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm" [class.text-red-600]="row.stockActuel <= row.stockAlerte">
                {{ row.stockActuel }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.stockAlerte }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.valeurStock | number }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RapportStocksPageComponent implements OnInit {
  rows: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/achats/stocks').subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

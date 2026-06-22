import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mes-reclamations-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Mes réclamations</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Nouvelle réclamation</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Motif</label>
          <textarea [(ngModel)]="newReclamation.motif" rows="4" class="w-full border rounded-lg px-3 py-2"></textarea>
        </div>
        <button (click)="submitReclamation()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Envoyer
        </button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Historique</h2>
        </div>
        <div *ngFor="let rec of reclamations" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <p>{{ rec.motif }}</p>
              <span class="text-xs text-gray-500">{{ rec.date | date:'short' }}</span>
            </div>
            <span class="px-2 py-1 text-xs rounded-full"
              [ngClass]="{
                'bg-yellow-100 text-yellow-800': rec.statut === 'ouverte',
                'bg-green-100 text-green-800': rec.statut === 'traitee',
                'bg-gray-100 text-gray-800': rec.statut === 'fermee'
              }">
              {{ rec.statut }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MesReclamationsPageComponent implements OnInit {
  reclamations: any[] = [];
  newReclamation: any = { motif: '', evaluationId: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadReclamations();
  }

  loadReclamations() {
    this.http.get(`${environment.API_URL}/scolarite/reclamations`).subscribe((data: any) => {
      this.reclamations = data;
    });
  }

  submitReclamation() {
    this.http.post(`${environment.API_URL}/scolarite/reclamations`, this.newReclamation).subscribe(() => {
      this.newReclamation = { motif: '', evaluationId: '' };
      this.loadReclamations();
    });
  }
}

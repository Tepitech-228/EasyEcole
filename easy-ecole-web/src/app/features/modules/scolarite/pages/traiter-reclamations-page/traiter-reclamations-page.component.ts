import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-traiter-reclamations-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Traiter les réclamations</h1>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Réclamations</h2>
        </div>
        <div *ngFor="let rec of reclamations" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="font-medium">{{ rec.motif }}</p>
              <p class="text-sm text-gray-500">Étudiant #{{ rec.etudiantId }}</p>
              <span class="text-xs text-gray-500">{{ rec.date | date:'short' }}</span>

              <div *ngIf="rec.statut !== 'fermee'" class="mt-3">
                <textarea [(ngModel)]="reponses[rec.id]" rows="2" placeholder="Votre réponse..."
                  class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                <button (click)="repondre(rec)" class="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
                  Répondre
                </button>
                <button (click)="fermer(rec)" class="mt-2 ml-2 bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700">
                  Fermer
                </button>
              </div>
            </div>
            <span class="px-2 py-1 text-xs rounded-full ml-4"
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
export class TraiterReclamationsPageComponent implements OnInit {
  reclamations: any[] = [];
  reponses: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadReclamations();
  }

  loadReclamations() {
    this.http.get(`${environment.API_URL}/scolarite/reclamations`).subscribe((data: any) => {
      this.reclamations = data;
    });
  }

  repondre(rec: any) {
    this.http.post(`${environment.API_URL}/scolarite/reclamations/repondre`, {
      reclamationId: rec.id,
      reponse: this.reponses[rec.id]
    }).subscribe(() => {
      this.reponses[rec.id] = '';
      this.loadReclamations();
    });
  }

  fermer(rec: any) {
    this.http.put(`${environment.API_URL}/scolarite/reclamations/${rec.id}`, { statut: 'fermee' })
      .subscribe(() => this.loadReclamations());
  }
}

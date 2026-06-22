import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-traiter-demandes-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Traiter les demandes de documents</h1>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Demandes en attente</h2>
        </div>
        <div *ngFor="let demande of demandes" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="font-medium">{{ demande.typeDocument?.libelle }}</p>
              <p class="text-sm text-gray-600">Étudiant #{{ demande.etudiantId }}</p>
              <p class="text-sm text-gray-500">Date: {{ demande.date | date:'short' }}</p>

              <div class="mt-3 flex gap-2" *ngIf="demande.statut === 'soumise'">
                <button (click)="traiter(demande.id, 'validee')"
                  class="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
                  Valider
                </button>
                <button (click)="traiter(demande.id, 'rejetee')"
                  class="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700">
                  Rejeter
                </button>
              </div>
            </div>
            <span class="px-2 py-1 text-xs rounded-full ml-4"
              [ngClass]="{
                'bg-yellow-100 text-yellow-800': demande.statut === 'soumise',
                'bg-blue-100 text-blue-800': demande.statut === 'validee',
                'bg-red-100 text-red-800': demande.statut === 'rejetee',
                'bg-green-100 text-green-800': demande.statut === 'delivree'
              }">
              {{ demande.statut }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TraiterDemandesPageComponent implements OnInit {
  demandes: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDemandes();
  }

  loadDemandes() {
    this.http.get(`${environment.API_URL}/scolarite/demandesDocument`).subscribe((data: any) => {
      this.demandes = data;
    });
  }

  traiter(id: number, statut: string) {
    this.http.put(`${environment.API_URL}/scolarite/demandesDocument/${id}`, { statut }).subscribe(() => {
      this.loadDemandes();
    });
  }
}

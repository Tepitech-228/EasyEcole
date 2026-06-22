import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-demandes-documents-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Demandes de documents</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Nouvelle demande</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Type de document</label>
          <select [(ngModel)]="newDemande.typeDocumentId" class="w-full border rounded-lg px-3 py-2">
            <option *ngFor="let type of typesDocument" [value]="type.id">{{ type.libelle }} - {{ type.frais }} FC</option>
          </select>
        </div>
        <button (click)="submitDemande()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Soumettre
        </button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Mes demandes</h2>
        </div>
        <div *ngFor="let demande of demandes" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">{{ demande.typeDocument?.libelle }}</p>
              <p class="text-sm text-gray-600">Date: {{ demande.date | date:'short' }}</p>
              <p *ngIf="demande.documentDelivre" class="text-sm text-green-600">
                Document: {{ demande.documentDelivre.fichierPDF }}
              </p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full"
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
export class DemandesDocumentsPageComponent implements OnInit {
  demandes: any[] = [];
  typesDocument: any[] = [];
  newDemande: any = { typeDocumentId: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDemandes();
    this.loadTypesDocument();
  }

  loadDemandes() {
    this.http.get(`${environment.API_URL}/scolarite/demandesDocument`).subscribe((data: any) => {
      this.demandes = data;
    });
  }

  loadTypesDocument() {
    this.http.get(`${environment.API_URL}/scolarite/typesDocument`).subscribe((data: any) => {
      this.typesDocument = data;
    });
  }

  submitDemande() {
    this.http.post(`${environment.API_URL}/scolarite/demandesDocument`, this.newDemande).subscribe(() => {
      this.newDemande = { typeDocumentId: '' };
      this.loadDemandes();
    });
  }
}

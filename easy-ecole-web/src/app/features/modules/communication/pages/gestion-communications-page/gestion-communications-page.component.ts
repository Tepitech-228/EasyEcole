import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-communications-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Gestion des communications</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Nouvelle communication</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Titre</label>
          <input [(ngModel)]="newComm.titre" class="w-full border rounded-lg px-3 py-2">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Contenu</label>
          <textarea [(ngModel)]="newComm.contenu" rows="4" class="w-full border rounded-lg px-3 py-2"></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Statut</label>
          <select [(ngModel)]="newComm.statut" class="w-full border rounded-lg px-3 py-2">
            <option value="brouillon">Brouillon</option>
            <option value="publiee">Publiée</option>
          </select>
        </div>
        <button (click)="createCommunication()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Créer
        </button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Communications</h2>
        </div>
        <div *ngFor="let comm of communications" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">{{ comm.titre }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ comm.contenu }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 text-xs rounded-full"
                [ngClass]="{'bg-yellow-100 text-yellow-800': comm.statut === 'brouillon', 'bg-green-100 text-green-800': comm.statut === 'publiee'}">
                {{ comm.statut }}
              </span>
              <button (click)="deleteCommunication(comm.id)" class="text-red-600 hover:text-red-800 text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GestionCommunicationsPageComponent implements OnInit {
  communications: any[] = [];
  newComm: any = { titre: '', contenu: '', statut: 'brouillon' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCommunications();
  }

  loadCommunications() {
    this.http.get(`${environment.API_URL}/communication/communications`).subscribe((data: any) => {
      this.communications = data;
    });
  }

  createCommunication() {
    this.http.post(`${environment.API_URL}/communication/communications`, this.newComm).subscribe(() => {
      this.newComm = { titre: '', contenu: '', statut: 'brouillon' };
      this.loadCommunications();
    });
  }

  deleteCommunication(id: number) {
    this.http.delete(`${environment.API_URL}/communication/communications/${id}`).subscribe(() => {
      this.loadCommunications();
    });
  }
}

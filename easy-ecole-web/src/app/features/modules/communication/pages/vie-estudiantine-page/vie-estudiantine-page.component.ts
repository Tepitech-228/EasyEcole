import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vie-estudiantine-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Vie Estudiantine</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Communications</h2>
          </div>
          <div *ngFor="let comm of communications" class="p-4 border-b hover:bg-gray-50">
            <h3 class="font-medium">{{ comm.titre }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ comm.contenu }}</p>
            <span class="text-xs text-gray-500">{{ comm.datePublication | date:'short' }}</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Actualités</h2>
          </div>
          <div *ngFor="let actu of actualites" class="p-4 border-b hover:bg-gray-50">
            <h3 class="font-medium">{{ actu.titre }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ actu.contenu }}</p>
            <div class="flex justify-between mt-2">
              <span class="text-xs text-gray-500">{{ actu.categorie }}</span>
              <span class="text-xs text-gray-500">{{ actu.date | date:'short' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VieEstudiantinePageComponent implements OnInit {
  communications: any[] = [];
  actualites: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(`${environment.API_URL}/communication/communications`).subscribe((data: any) => {
      this.communications = data;
    });
    this.http.get(`${environment.API_URL}/communication/actualites`).subscribe((data: any) => {
      this.actualites = data;
    });
  }
}

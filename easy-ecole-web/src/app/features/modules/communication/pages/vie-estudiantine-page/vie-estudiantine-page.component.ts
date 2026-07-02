import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vie-estudiantine-page',
  template: `
    <div class="p-6 space-y-6">
      <div class="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-sm">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-slate-300">Campus et vie étudiante</p>
          <h2 class="mt-2 text-2xl font-semibold">Vie étudiante</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">Un espace central pour suivre les communications et les actualités du campus.</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h3 class="text-lg font-semibold text-slate-900">Communications</h3>
          </div>
          <div *ngFor="let comm of communications" class="border-b border-slate-100 p-5 transition hover:bg-slate-50">
            <h4 class="font-semibold text-slate-900">{{ comm.titre }}</h4>
            <p class="mt-1 text-sm leading-7 text-slate-600">{{ comm.contenu }}</p>
            <span class="mt-3 inline-flex text-xs text-slate-500">{{ comm.datePublication | date:'short' }}</span>
          </div>
          <div *ngIf="communications.length === 0" class="p-8 text-center text-slate-500">
            Aucune communication à afficher.
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h3 class="text-lg font-semibold text-slate-900">Actualités</h3>
          </div>
          <div *ngFor="let actu of actualites" class="border-b border-slate-100 p-5 transition hover:bg-slate-50">
            <h4 class="font-semibold text-slate-900">{{ actu.titre }}</h4>
            <p class="mt-1 text-sm leading-7 text-slate-600">{{ actu.contenu }}</p>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{{ actu.categorie }}</span>
              <span class="text-xs text-slate-500">{{ actu.date | date:'short' }}</span>
            </div>
          </div>
          <div *ngIf="actualites.length === 0" class="p-8 text-center text-slate-500">
            Aucune actualité disponible.
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

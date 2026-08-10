import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-semestres-page',
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Programmation des semestres</h1>
          <p class="text-sm text-gray-500">Définissez le semestre officiel par parcours et année académique.</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 text-sm text-gray-600">Cette vue permet de piloter les semestres officiels, de les activer et de les clôturer pour verrouiller la saisie des notes.</div>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Parcours</label>
            <input [(ngModel)]="form.parcoursId" type="number" class="w-full rounded-xl border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Année académique</label>
            <input [(ngModel)]="form.anneeAcademiqueId" type="number" class="w-full rounded-xl border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Semestre</label>
            <select [(ngModel)]="form.codeSemestre" class="w-full rounded-xl border border-gray-300 px-3 py-2">
              <option value="semestre1">Semestre 1</option>
              <option value="semestre2">Semestre 2</option>
              <option value="semestre3">Semestre 3</option>
              <option value="semestre4">Semestre 4</option>
              <option value="semestre5">Semestre 5</option>
              <option value="semestre6">Semestre 6</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button (click)="create()" class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Créer le semestre</button>
          <button (click)="load()" class="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Actualiser</button>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Semestre</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Parcours</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Année</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let item of semestres">
              <td class="px-4 py-3">{{ item.libelle }}</td>
              <td class="px-4 py-3">{{ item.parcours?.titre || item.parcoursId }}</td>
              <td class="px-4 py-3">{{ item.anneeAcademique?.libelle || item.anneeAcademiqueId }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{{ item.statut }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                <button *ngIf="item.statut !== 'en_cours'" (click)="activate(item.id)" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Activer</button>
                <button *ngIf="item.statut === 'en_cours'" (click)="close(item.id)" class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">Clôturer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class GestionSemestresPageComponent implements OnInit {
  semestres: any[] = [];
  form = { parcoursId: 1, anneeAcademiqueId: 1, codeSemestre: 'semestre1' };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get(`${environment.apiUrl}/inscription/semestres-academiques`).subscribe((res: any) => {
      this.semestres = res;
    });
  }

  create(): void {
    this.http.post(`${environment.apiUrl}/inscription/semestres-academiques`, {
      ...this.form,
      libelle: `Semestre ${this.form.codeSemestre}`
    }).subscribe(() => this.load());
  }

  activate(id: number): void {
    this.http.post(`${environment.apiUrl}/inscription/semestres-academiques/${id}/activate`, {}).subscribe(() => this.load());
  }

  close(id: number): void {
    this.http.post(`${environment.apiUrl}/inscription/semestres-academiques/${id}/close`, {}).subscribe(() => this.load());
  }
}

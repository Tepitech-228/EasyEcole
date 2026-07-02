import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-suggestions-page',
  template: `
    <div class="p-6 space-y-6">
      <div class="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-sm">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-slate-300">Retour d’expérience</p>
          <h2 class="mt-2 text-2xl font-semibold">Suggestions</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">Faites remonter vos idées et observations pour améliorer la vie scolaire et la qualité des services.</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900">Soumettre une suggestion</h3>
          <p class="mt-1 text-sm text-slate-500">Votre message sera traité par l’équipe de gestion.</p>
          <div class="mt-5 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select [(ngModel)]="newSuggestion.type" class="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="etudiant">Étudiant</option>
                <option value="enseignant">Enseignant</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Message</label>
              <textarea [(ngModel)]="newSuggestion.message" rows="4" class="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"></textarea>
            </div>
            <button (click)="submitSuggestion()" class="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              Envoyer
            </button>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h3 class="text-lg font-semibold text-slate-900">Mes suggestions</h3>
          </div>
          <div *ngFor="let suggestion of suggestions" class="border-b border-slate-100 p-5 transition hover:bg-slate-50">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-slate-800">{{ suggestion.type }}</span>
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{{ suggestion.date | date:'short' }}</span>
                </div>
                <p class="mt-2 text-sm leading-7 text-slate-600">{{ suggestion.message }}</p>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                [ngClass]="{
                  'bg-amber-100 text-amber-800': suggestion.statut === 'ouverte',
                  'bg-emerald-100 text-emerald-800': suggestion.statut === 'traitee',
                  'bg-slate-100 text-slate-700': suggestion.statut === 'fermee'
                }">
                {{ suggestion.statut }}
              </span>
            </div>
          </div>
          <div *ngIf="suggestions.length === 0" class="p-8 text-center text-slate-500">
            Aucune suggestion enregistrée pour le moment.
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuggestionsPageComponent implements OnInit {
  suggestions: any[] = [];
  newSuggestion: any = { type: 'etudiant', message: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.http.get(`${environment.API_URL}/communication/suggestions`).subscribe((data: any) => {
      this.suggestions = data;
    });
  }

  submitSuggestion() {
    this.http.post(`${environment.API_URL}/communication/suggestions`, this.newSuggestion).subscribe(() => {
      this.newSuggestion = { type: 'etudiant', message: '' };
      this.loadSuggestions();
    });
  }
}

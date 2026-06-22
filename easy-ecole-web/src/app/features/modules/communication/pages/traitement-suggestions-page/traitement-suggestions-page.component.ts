import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-traitement-suggestions-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Gestion des suggestions</h1>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Toutes les suggestions</h2>
        </div>
        <div *ngFor="let suggestion of suggestions" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ suggestion.type }}</span>
                <span class="text-xs text-gray-500">#{{ suggestion.utilisateurId }}</span>
              </div>
              <p class="mt-1">{{ suggestion.message }}</p>
              <span class="text-xs text-gray-500">{{ suggestion.date | date:'short' }}</span>

              <div *ngIf="suggestion.statut !== 'fermee'" class="mt-3">
                <textarea [(ngModel)]="reponses[suggestion.id]" rows="2" placeholder="Votre réponse..."
                  class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                <button (click)="repondre(suggestion)" class="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
                  Répondre
                </button>
                <button (click)="fermer(suggestion)" class="mt-2 ml-2 bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700">
                  Fermer
                </button>
              </div>
            </div>
            <span class="px-2 py-1 text-xs rounded-full ml-4"
              [ngClass]="{
                'bg-yellow-100 text-yellow-800': suggestion.statut === 'ouverte',
                'bg-green-100 text-green-800': suggestion.statut === 'traitee',
                'bg-gray-100 text-gray-800': suggestion.statut === 'fermee'
              }">
              {{ suggestion.statut }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TraitementSuggestionsPageComponent implements OnInit {
  suggestions: any[] = [];
  reponses: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.http.get(`${environment.API_URL}/communication/suggestions`).subscribe((data: any) => {
      this.suggestions = data;
    });
  }

  repondre(suggestion: any) {
    this.http.post(`${environment.API_URL}/communication/suggestions/repondre`, {
      suggestionId: suggestion.id,
      message: this.reponses[suggestion.id]
    }).subscribe(() => {
      this.reponses[suggestion.id] = '';
      this.loadSuggestions();
    });
  }

  fermer(suggestion: any) {
    this.http.put(`${environment.API_URL}/communication/suggestions/${suggestion.id}`, { statut: 'fermee' })
      .subscribe(() => this.loadSuggestions());
  }
}

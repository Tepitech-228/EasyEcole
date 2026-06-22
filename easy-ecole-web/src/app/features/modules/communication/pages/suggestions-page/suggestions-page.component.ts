import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-suggestions-page',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Suggestions</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Soumettre une suggestion</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Type</label>
          <select [(ngModel)]="newSuggestion.type" class="w-full border rounded-lg px-3 py-2">
            <option value="etudiant">Étudiant</option>
            <option value="enseignant">Enseignant</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Message</label>
          <textarea [(ngModel)]="newSuggestion.message" rows="4" class="w-full border rounded-lg px-3 py-2"></textarea>
        </div>
        <button (click)="submitSuggestion()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Envoyer
        </button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Mes suggestions</h2>
        </div>
        <div *ngFor="let suggestion of suggestions" class="p-4 border-b hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-sm font-medium">{{ suggestion.type }}</span>
              <p class="mt-1">{{ suggestion.message }}</p>
              <span class="text-xs text-gray-500">{{ suggestion.date | date:'short' }}</span>
            </div>
            <span class="px-2 py-1 text-xs rounded-full"
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

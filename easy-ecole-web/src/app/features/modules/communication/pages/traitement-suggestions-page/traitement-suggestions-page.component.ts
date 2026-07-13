import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-traitement-suggestions-page',
  templateUrl: './traitement-suggestions-page.component.html',
  styleUrls: ['./traitement-suggestions-page.component.scss']
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

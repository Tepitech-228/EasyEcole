import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-suggestions-page',
  templateUrl: './suggestions-page.component.html',
  styleUrls: ['./suggestions-page.component.scss']
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

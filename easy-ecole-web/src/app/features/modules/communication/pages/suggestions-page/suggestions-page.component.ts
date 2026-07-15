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
  loading: boolean = true;
  submitting: boolean = false;
  successMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.loading = true;
    this.http.get(`${environment.API_URL}/communication/suggestions`).subscribe({
      next: (data: any) => {
        this.suggestions = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  submitSuggestion() {
    if (this.submitting || !this.newSuggestion.message.trim()) return;
    this.submitting = true;
    this.successMessage = '';
    this.http.post(`${environment.API_URL}/communication/suggestions`, this.newSuggestion).subscribe({
      next: () => {
        this.newSuggestion = { type: 'etudiant', message: '' };
        this.successMessage = 'Votre suggestion a été envoyée avec succès.';
        this.submitting = false;
        this.loadSuggestions();
      },
      error: () => { this.submitting = false; }
    });
  }
}

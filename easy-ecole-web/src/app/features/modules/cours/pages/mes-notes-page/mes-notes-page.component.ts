import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mes-notes-page',
  templateUrl: './mes-notes-page.component.html',
  styleUrls: ['./mes-notes-page.component.scss']
})
export class MesNotesPageComponent extends BaseComponentClass implements OnInit {
  notes: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  private apiUrl = `${environment.API_MODULES.INSCRIPTION}/publications-notes/mes-notes`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get(this.apiUrl).subscribe({
      next: (data: any) => {
        this.notes = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        this.error = "Impossible de charger vos notes";
        this.loading = false;
      }
    });
  }

  getNoteClass(v: number | null): string {
    if (v == null) return '';
    return v >= 10 ? 'text-emerald-600' : 'text-orange-600';
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

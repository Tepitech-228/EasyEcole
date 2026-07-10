import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-widget-notes-a-saisir',
  templateUrl: './widget-notes-a-saisir.component.html',
  styleUrls: ['./widget-notes-a-saisir.component.scss']
})
export class WidgetNotesASaisirComponent implements OnInit {
  evaluations: any[] = []
  loading: boolean = true

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const url = `${environment.API_MODULES.INSCRIPTION}/listesNoteEvaluation`
    this.http.get(url).subscribe({
      next: (data: any) => {
        this.evaluations = (Array.isArray(data) ? data : [])
          .filter((e: any) => e.statut === 'brouillon' || e.statut === 'en_cours')
          .slice(0, 5)
        this.loading = false
      },
      error: () => this.loading = false
    })
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-widget-notes-recentes',
  templateUrl: './widget-notes-recentes.component.html',
  styleUrls: ['./widget-notes-recentes.component.scss']
})
export class WidgetNotesRecentesComponent implements OnInit {
  notes: any[] = []
  loading: boolean = true

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const url = `${environment.API_MODULES.INSCRIPTION}/publications-notes/mes-notes`
    this.http.get(url).subscribe({
      next: (data: any) => {
        this.notes = (Array.isArray(data) ? data : []).slice(0, 5)
        this.loading = false
      },
      error: () => this.loading = false
    })
  }
}

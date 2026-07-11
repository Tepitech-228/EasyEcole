import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-notes-page',
  templateUrl: './rapport-notes-page.component.html',
  styleUrls: ['./rapport-notes-page.component.scss']
})
export class RapportNotesPageComponent implements OnInit {
  moyennes: any[] = [];
  reussite: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/notes/moyennes').subscribe({
      next: (res: any) => this.moyennes = res
    });
    this.http.get('/api/reporting/notes/reussite').subscribe({
      next: (res: any) => this.reussite = res
    });
  }
}

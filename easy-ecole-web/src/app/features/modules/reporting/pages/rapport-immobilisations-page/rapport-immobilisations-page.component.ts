import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-immobilisations-page',
  templateUrl: './rapport-immobilisations-page.component.html',
  styleUrls: ['./rapport-immobilisations-page.component.scss']
})
export class RapportImmobilisationsPageComponent implements OnInit {
  rows: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/achats/immobilisations').subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

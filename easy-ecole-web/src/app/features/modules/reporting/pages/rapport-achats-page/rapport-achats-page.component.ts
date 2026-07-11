import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-achats-page',
  templateUrl: './rapport-achats-page.component.html',
  styleUrls: ['./rapport-achats-page.component.scss']
})
export class RapportAchatsPageComponent implements OnInit {
  rows: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/achats').subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-stocks-page',
  templateUrl: './rapport-stocks-page.component.html',
  styleUrls: ['./rapport-stocks-page.component.scss']
})
export class RapportStocksPageComponent implements OnInit {
  rows: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/achats/stocks').subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

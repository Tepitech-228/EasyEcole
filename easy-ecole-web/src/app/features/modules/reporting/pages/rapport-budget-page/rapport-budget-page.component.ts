import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-budget-page',
  templateUrl: './rapport-budget-page.component.html',
  styleUrls: ['./rapport-budget-page.component.scss']
})
export class RapportBudgetPageComponent implements OnInit {
  rows: any[] = [];
  ecart: any = { totalPrevu: 0, totalReel: 0, ecartTotal: 0 };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/budget').subscribe({
      next: (res: any) => this.rows = res
    });
    this.http.get('/api/reporting/budget/ecart').subscribe({
      next: (res: any) => this.ecart = res
    });
  }
}

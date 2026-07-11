import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-effectifs-page',
  templateUrl: './rapport-effectifs-page.component.html',
  styleUrls: ['./rapport-effectifs-page.component.scss']
})
export class RapportEffectifsPageComponent implements OnInit {
  rows: any[] = [];
  summary: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/effectifs').subscribe({
      next: (res: any) => this.rows = res
    });
    this.http.get('/api/reporting/effectifs/summary').subscribe({
      next: (res: any) => this.summary = res
    });
  }
}

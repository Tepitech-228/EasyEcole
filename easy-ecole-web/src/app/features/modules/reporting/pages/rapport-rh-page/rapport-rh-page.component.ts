import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-rh-page',
  templateUrl: './rapport-rh-page.component.html',
  styleUrls: ['./rapport-rh-page.component.scss']
})
export class RapportRhPageComponent implements OnInit {
  effectifs: any[] = [];
  paie: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/rh/effectifs').subscribe({
      next: (res: any) => this.effectifs = res
    });
    this.http.get('/api/reporting/rh/paie').subscribe({
      next: (res: any) => this.paie = res
    });
  }
}

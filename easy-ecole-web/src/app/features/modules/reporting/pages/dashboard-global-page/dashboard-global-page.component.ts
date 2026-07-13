import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-global-page',
  templateUrl: './dashboard-global-page.component.html',
  styleUrls: ['./dashboard-global-page.component.scss']
})
export class DashboardGlobalPageComponent implements OnInit {
  data: any = {};
  links = [
    { path: '/reporting/effectifs', label: 'Effectifs' },
    { path: '/reporting/notes', label: 'Notes & Réussite' },
    { path: '/reporting/paiements', label: 'Paiements & Factures' },
    { path: '/reporting/budget', label: 'Budget vs Réel' },
    { path: '/reporting/rh', label: 'Ressources Humaines' },
    { path: '/reporting/stocks', label: 'Stocks' },
    { path: '/reporting/immobilisations', label: 'Immobilisations' },
    { path: '/reporting/achats', label: 'Achats' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/consolide/dashboard').subscribe({
      next: (res: any) => this.data = res,
      error: () => {}
    });
  }
}

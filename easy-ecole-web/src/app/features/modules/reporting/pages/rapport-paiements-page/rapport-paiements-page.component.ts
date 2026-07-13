import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapport-paiements-page',
  templateUrl: './rapport-paiements-page.component.html',
  styleUrls: ['./rapport-paiements-page.component.scss']
})
export class RapportPaiementsPageComponent implements OnInit {
  paiements: any[] = [];
  factures: any[] = [];
  totaux: any = {};

  get paiementLabels(): string[] {
    return this.paiements.map(p => p.date?.slice(0, 10) || '');
  }
  get paiementData(): number[] {
    return this.paiements.map(p => Number(p.montantTotal) || 0);
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('/api/reporting/paiements').subscribe({
      next: (res: any) => this.paiements = res
    });
    this.http.get('/api/reporting/paiements/factures').subscribe({
      next: (res: any) => this.factures = res
    });
    this.http.get('/api/reporting/paiements/totaux').subscribe({
      next: (res: any) => this.totaux = res
    });
  }
}

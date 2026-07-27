import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

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

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getPaiements().subscribe({
      next: (res: any) => this.paiements = res
    });
    this.reporting.getPaiementsFactures().subscribe({
      next: (res: any) => this.factures = res
    });
    this.reporting.getPaiementsTotaux().subscribe({
      next: (res: any) => this.totaux = res
    });
  }
}

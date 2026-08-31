import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';

@Component({
  selector: 'app-dashboard-global-page',
  templateUrl: './dashboard-global-page.component.html',
  styleUrls: ['./dashboard-global-page.component.scss']
})
export class DashboardGlobalPageComponent implements OnInit {
  data: any = {};
chartEffectifs: number[] = [];
chartEffectifsLabels: string[] = [];
chartPaiements: number[] = [];
chartPaiementsLabels: string[] = [];
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

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getDashboard().pipe(untilDestroyed(this)).subscribe({
      next: (res: any) => {
        this.data = res;
        this.chartEffectifs = res?.effectifsParMois || [];
        this.chartEffectifsLabels = res?.moisLabels || [];
        this.chartPaiements = res?.paiementsParMois || [];
        this.chartPaiementsLabels = res?.moisLabels || [];
      },
      error: () => {}
    });
  }
}

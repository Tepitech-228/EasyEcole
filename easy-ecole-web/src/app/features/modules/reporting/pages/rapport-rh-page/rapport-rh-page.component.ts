import { Component, OnInit } from '@angular/core';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-rh-page',
  templateUrl: './rapport-rh-page.component.html',
  styleUrls: ['./rapport-rh-page.component.scss']
})
export class RapportRhPageComponent implements OnInit {
  chartLabels: string[] = [];
  chartData: number[] = [];
  effectifs: any[] = [];
  paie: any[] = [];

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getRhEffectifs().subscribe({
      next: (res: any) => {
        this.effectifs = res;
        this.chartLabels = res.map((row: any) => row.date?.slice(0, 10) || 'N/A');
        this.chartData = res.map((row: any) => Number(row.nbEmployes) || 0);
      },
      error: () => {
        this.effectifs = [];
        this.chartLabels = [];
        this.chartData = [];
      }
    });
    this.reporting.getRhPaie().subscribe({
      next: (res: any) => this.paie = res,
      error: () => { this.paie = []; }
    });
  }
}

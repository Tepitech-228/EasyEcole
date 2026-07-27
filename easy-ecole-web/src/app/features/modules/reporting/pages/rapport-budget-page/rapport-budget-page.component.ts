import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-budget-page',
  templateUrl: './rapport-budget-page.component.html',
  styleUrls: ['./rapport-budget-page.component.scss']
})
export class RapportBudgetPageComponent implements OnInit {
  rows: any[] = [];
chartPrevu: number[] = [];
chartReel: number[] = [];
chartLabels: string[] = [];
  ecart: any = { totalPrevu: 0, totalReel: 0, ecartTotal: 0 };

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getBudget().subscribe({
      next: (res: any) => this.rows = res
    });
    this.reporting.getBudgetEcart().subscribe({
      next: (res: any) => this.ecart = res
    });
  }
}

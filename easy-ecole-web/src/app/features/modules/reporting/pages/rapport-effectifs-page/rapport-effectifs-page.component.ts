import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-effectifs-page',
  templateUrl: './rapport-effectifs-page.component.html',
  styleUrls: ['./rapport-effectifs-page.component.scss']
})
export class RapportEffectifsPageComponent implements OnInit {
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartInscrits: number[] = [];
  chartActifs: number[] = [];
  rows: any[] = [];
  summary: any = {};

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getEffectifs().subscribe({
      next: (res: any) => this.rows = res
    });
    this.reporting.getEffectifsSummary().subscribe({
      next: (res: any) => this.summary = res
    });
  }
}

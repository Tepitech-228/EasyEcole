import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-stocks-page',
  templateUrl: './rapport-stocks-page.component.html',
  styleUrls: ['./rapport-stocks-page.component.scss']
})
export class RapportStocksPageComponent implements OnInit {
  rows: any[] = [];
chartData: number[] = [];
chartLabels: string[] = [];

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getStocks().subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

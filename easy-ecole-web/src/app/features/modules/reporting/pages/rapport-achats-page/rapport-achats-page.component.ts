import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-achats-page',
  templateUrl: './rapport-achats-page.component.html',
  styleUrls: ['./rapport-achats-page.component.scss']
})
export class RapportAchatsPageComponent implements OnInit {
  rows: any[] = [];
chartData: number[] = [];
chartLabels: string[] = [];

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getAchats().subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

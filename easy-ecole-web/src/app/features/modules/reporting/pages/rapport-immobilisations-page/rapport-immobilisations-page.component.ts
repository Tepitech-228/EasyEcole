import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-immobilisations-page',
  templateUrl: './rapport-immobilisations-page.component.html',
  styleUrls: ['./rapport-immobilisations-page.component.scss']
})
export class RapportImmobilisationsPageComponent implements OnInit {
  rows: any[] = [];
chartData: number[] = [];
chartLabels: string[] = [];

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getImmobilisations().subscribe({
      next: (res: any) => this.rows = res
    });
  }
}

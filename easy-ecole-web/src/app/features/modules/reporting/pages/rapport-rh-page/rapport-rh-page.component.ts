import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
      next: (res: any) => this.effectifs = res
    });
    this.reporting.getRhPaie().subscribe({
      next: (res: any) => this.paie = res
    });
  }
}

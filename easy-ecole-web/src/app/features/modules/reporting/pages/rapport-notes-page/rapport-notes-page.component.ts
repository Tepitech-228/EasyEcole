import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from 'src/app/data/modules/reporting/services/reporting.service';

@Component({
  selector: 'app-rapport-notes-page',
  templateUrl: './rapport-notes-page.component.html',
  styleUrls: ['./rapport-notes-page.component.scss']
})
export class RapportNotesPageComponent implements OnInit {
  chartLabels: string[] = [];
  chartData: number[] = [];
  moyennes: any[] = [];
  reussite: any[] = [];

  constructor(private reporting: ReportingService) {}

  ngOnInit(): void {
    this.reporting.getNotesMoyennes().subscribe({
      next: (res: any) => this.moyennes = res
    });
    this.reporting.getNotesReussite().subscribe({
      next: (res: any) => this.reussite = res
    });
  }
}

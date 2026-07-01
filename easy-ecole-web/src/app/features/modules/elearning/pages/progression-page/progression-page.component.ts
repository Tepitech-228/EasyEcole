import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ProgressionService } from 'src/app/data/modules/elearning/services/progression.service';

@Component({
  selector: 'app-progression-page',
  templateUrl: './progression-page.component.html',
  styleUrls: ['./progression-page.component.scss']
})
export class ProgressionPageComponent extends BaseComponentClass implements OnInit {
  data: any = null;
  loading = true;

  constructor(private progressionService: ProgressionService) {
    super();
  }

  ngOnInit(): void {
    this.progressionService.getProgression().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  getScoreColor(value: number): string {
    if (value >= 7) return 'text-green-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-red-600';
  }
}

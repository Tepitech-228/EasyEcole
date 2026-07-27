import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-evaluations-page',
  templateUrl: './liste-evaluations-page.component.html',
  styleUrls: ['./liste-evaluations-page.component.scss']
})
export class ListeEvaluationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  evaluations: any[] = [];

  constructor() { super() }

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations() {
    this.loading = true;
    setTimeout(() => {
      this.evaluations = [
        { id: 1, employe: 'Dupont Jean', evaluateur: 'Marie Martin', date: '2026-01-30', noteGlobale: 14 },
        { id: 2, employe: 'Bernard Luc', evaluateur: 'Marie Martin', date: '2026-01-28', noteGlobale: 11 },
      ];
      this.loading = false;
    }, 500);
  }

  getNoteBadge(note: number): string {
    if (note >= 16) return 'bg-green-100 text-green-700';
    if (note >= 12) return 'bg-blue-100 text-blue-700';
    if (note >= 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }
}

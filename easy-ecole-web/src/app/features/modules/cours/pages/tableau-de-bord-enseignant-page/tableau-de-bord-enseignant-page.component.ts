import { Component, OnInit } from '@angular/core';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-tableau-de-bord-enseignant-page',
  templateUrl: './tableau-de-bord-enseignant-page.component.html',
  styleUrls: ['./tableau-de-bord-enseignant-page.component.scss']
})
export class TableauDeBordEnseignantPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  error: string = '';
  dashboard: any = null;

  constructor(private seanceService: SeanceService) {
    super();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    this.seanceService.getTeacherDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement du tableau de bord';
        this.loading = false;
      }
    });
  }
}

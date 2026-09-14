import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CabinetComptableService } from 'src/app/data/modules/comptabilite/services/cabinet-comptable.service';

@Component({
  selector: 'app-dashboard-cabinet-page',
  templateUrl: './dashboard-cabinet-page.component.html',
  styleUrls: ['./dashboard-cabinet-page.component.scss']
})
export class DashboardCabinetPageComponent extends BaseComponentClass implements OnInit {
  loading = true;
  error = false;
  apiErrorMessage = '';

  total = 0;
  valides = 0;
  rejetes = 0;

  constructor(private cabinetService: CabinetComptableService) {
    super();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.cabinetService.getDashboard().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.total = res.data.total || 0;
          this.valides = res.data.valides || 0;
          this.rejetes = res.data.rejetes || 0;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = true;
        this.apiErrorMessage = err?.error?.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }
}

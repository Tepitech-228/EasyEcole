import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecretariatDashboardService } from 'src/app/data/modules/scolarite/services/secretariat-dashboard.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';

@Component({
  selector: 'app-dashboard-secretariat-page',
  templateUrl: './dashboard-secretariat-page.component.html',
  styleUrls: ['./dashboard-secretariat-page.component.scss']
})
export class DashboardSecretariatPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = true;
  stats: any = {};
  activity: any[] = [];

  constructor(private dashboardService: SecretariatDashboardService) {
    super();
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadActivity();
  }

  loadStats(): void {
    this.loading = true;
    this.dashboardService.getStats().pipe(untilDestroyed(this)).subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadActivity(): void {
    this.dashboardService.getRecentActivity(10).pipe(untilDestroyed(this)).subscribe({
      next: (data) => { this.activity = data; },
      error: () => {}
    });
  }

}

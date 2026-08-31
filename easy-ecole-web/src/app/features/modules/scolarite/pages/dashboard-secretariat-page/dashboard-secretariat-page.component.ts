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

  // ─── Graphiques dynamiques construits à partir des KPIs chargés ───
  /** Doughnut « répartition des dossiers » depuis les KPIs existants. */
  get secretariatRepartitionPayload(): any {
    const s = this.stats || {};
    const demandes = s.demandes || 0;
    const enAttente = s.enAttentePaiement || 0;
    const aPreparer = s.aPreparer || 0;
    const prets = s.prets || 0;
    const remis = s.remis || 0;
    const recus = s.recus || 0;

    // On ne construit le graphique que si au moins une valeur est présente.
    const hasData = demandes > 0 || enAttente > 0 || aPreparer > 0 || (prets + remis) > 0 || recus > 0;
    if (!hasData) return null;

    return {
      type: 'doughnut',
      labels: ['Demandes reçues', 'En attente de paiement', 'Payées / à préparer', 'Prêtes / remises', 'Reçus générés'],
      datasets: [{
        label: 'Dossiers',
        data: [demandes, enAttente, aPreparer, prets + remis, recus],
      }],
      colors: ['#1769aa', '#d97706', '#4f46a5', '#087f8c', '#079669'],
    };
  }

  /** Barres « documents finalisés » : prêts vs remis vs reçus. */
  get secretariatDocumentsPayload(): any {
    const s = this.stats || {};
    const prets = s.prets || 0;
    const remis = s.remis || 0;
    const recus = s.recus || 0;
    if (prets <= 0 && remis <= 0 && recus <= 0) return null;

    return {
      type: 'bar',
      labels: ['Prêts', 'Remis', 'Reçus générés'],
      datasets: [{ label: 'Documents', data: [prets, remis, recus] }],
      colors: ['#087f8c', '#079669', '#4f46a5'],
    };
  }
}

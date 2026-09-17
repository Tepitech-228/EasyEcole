import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CabinetComptableService } from 'src/app/data/modules/comptabilite/services/cabinet-comptable.service';
import { ChartPanelPayload } from 'src/app/shared/modern-ui/components/chart-panel/chart-panel.component';

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

  dashboardData: any = null;
  statutsPayload?: ChartPanelPayload;
  evolutionPayload?: ChartPanelPayload;
  moyensPayload?: ChartPanelPayload;
  banquesPayload?: ChartPanelPayload;

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
          this.dashboardData = res.data;
          this.total = res.data.total || 0;
          this.valides = res.data.valides || 0;
          this.rejetes = res.data.rejetes || 0;
          this.buildChartPayloads(res.data.charts);
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

  private buildChartPayloads(charts: any): void {
    if (!charts) return;

    // --- Libellés FR pour les clés techniques ---
    const statutLabels: Record<string, string> = {
      en_attente: 'En attente',
      valide: 'Validé',
      rejete: 'Rejeté',
      en_saisie_comptable: 'En saisie comptable',
      traite: 'Traité'
    };
    const moyenLabels: Record<string, string> = {
      virement: 'Virement',
      especes: 'Espèces',
      mobile_money: 'Mobile Money',
      cheque: 'Chèque',
      autre: 'Autre',
      depot_banque: 'Dépôt en banque'
    };
    const banqueLabels: Record<string, string> = {
      ib_bank: 'IB Bank',
      ecobank: 'Ecobank',
      orabank: 'Orabank'
    };

    // --- Doughnut : répartition par statut ---
    // Le backend renvoie un tableau brut : [{ statut: 'valide', nombre: 5 }, ...]
    const parStatut: Array<{ statut: string; nombre: number }> = charts.parStatut || [];
    if (parStatut.length) {
      this.statutsPayload = {
        type: 'doughnut',
        labels: parStatut.map(r => statutLabels[r.statut] || r.statut),
        datasets: [{ data: parStatut.map(r => r.nombre) }],
        colors: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#6366f1']
      };
    }

    // --- Line : évolution sur 6 mois ---
    const evolution: Array<{ mois: string; nombre: number }> = charts.evolutionSixMois || [];
    if (evolution.length) {
      this.evolutionPayload = {
        type: 'line',
        labels: evolution.map(r => r.mois),
        datasets: [{ label: 'Bordereaux', data: evolution.map(r => r.nombre) }]
      };
    }

    // --- Doughnut : répartition par moyen de paiement ---
    const parMoyen: Array<{ moyenPaiement: string; nombre: number }> = charts.parMoyenPaiement || [];
    if (parMoyen.length) {
      this.moyensPayload = {
        type: 'doughnut',
        labels: parMoyen.map(r => moyenLabels[r.moyenPaiement] || r.moyenPaiement),
        datasets: [{ data: parMoyen.map(r => r.nombre) }],
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280', '#06b6d4']
      };
    }

    // --- Doughnut : répartition par banque ---
    const parBanque: Array<{ banque: string; nombre: number }> = charts.parBanque || [];
    if (parBanque.length) {
      this.banquesPayload = {
        type: 'doughnut',
        labels: parBanque.map(r => banqueLabels[r.banque] || r.banque),
        datasets: [{ data: parBanque.map(r => r.nombre) }],
        colors: ['#ef4444', '#10b981', '#f59e0b']
      };
    }
  }
}

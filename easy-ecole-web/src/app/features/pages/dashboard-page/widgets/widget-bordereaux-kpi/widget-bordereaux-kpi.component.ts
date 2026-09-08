import { Component, OnInit } from '@angular/core';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';

interface PaymentStat {
  label: string;
  count: number;
  percent: number;
  color: string;
}

/**
 * Widget d'accueil « ESA-Compta » : KPI + graphiques de suivi des bordereaux.
 * Auto-alimenté via BordereauService.getAImputer() — mêmes données (et mêmes
 * calculs) que la page de traitement /inscription/finance/bordereaux.
 */
@Component({
  selector: 'app-widget-bordereaux-kpi',
  templateUrl: './widget-bordereaux-kpi.component.html',
  styleUrls: ['./widget-bordereaux-kpi.component.scss']
})
export class WidgetBordereauxKpiComponent implements OnInit {
  bordereaux: Bordereau[] = [];

  loading = true;

  // KPIs
  totalCount = 0;
  enAttenteCount = 0;
  validesCount = 0;
  rejetesCount = 0;
  anomaliesCount = 0;
  referencesCount = 0;

  // Moyens de paiement (graphique)
  paymentStats: PaymentStat[] = [];

  constructor(private bordereauService: BordereauService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.bordereauService.getAImputer({ page: 1, limit: 50 }).subscribe({
      next: (res: any) => {
        this.bordereaux = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        this.calculateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private calculateKPIs(): void {
    const b = this.bordereaux;

    this.totalCount = b.length;
    this.enAttenteCount = b.filter(x => x.statut === 'en_attente').length;
    this.validesCount = b.filter(x => x.statut === 'valide').length;
    this.rejetesCount = b.filter(x => x.statut === 'rejete').length;
    this.anomaliesCount = b.filter(x => x.statut === 'en_saisie_comptable').length;
    this.referencesCount = b.filter(x => x.referenceBancaire).length;

    const virement = b.filter(x => x.moyenPaiement === 'virement').length;
    const especes = b.filter(x => x.moyenPaiement === 'especes').length;
    const mobile = b.filter(x => x.moyenPaiement === 'mobile_money').length;
    const cheque = b.filter(x => x.moyenPaiement === 'cheque').length;
    const depot = b.filter(x => x.moyenPaiement === 'depot_banque').length;
    const autre = b.filter(x => x.moyenPaiement === 'autre').length;

    this.paymentStats = [
      { label: 'Virement', count: virement, percent: this.getPercent(virement), color: 'blue' },
      { label: 'Espèces', count: especes, percent: this.getPercent(especes), color: 'green' },
      { label: 'Mobile Money', count: mobile, percent: this.getPercent(mobile), color: 'purple' },
      { label: 'Chèque', count: cheque, percent: this.getPercent(cheque), color: 'orange' },
      { label: 'Dépôt banque', count: depot, percent: this.getPercent(depot), color: 'indigo' },
      { label: 'Autres', count: autre, percent: this.getPercent(autre), color: 'gray' },
    ].filter(s => s.count > 0);
  }

  getPercent(value: number): number {
    const total = this.bordereaux.length || 1;
    return Math.round((value / total) * 100);
  }
}
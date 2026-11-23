import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BORDEREAU_BANK_REFERENCES } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { SuiviRecouvrementService } from 'src/app/data/modules/inscription/services/suivi-recouvrement.service';
import { ChartPanelPayload } from 'src/app/shared/modern-ui/components/chart-panel/chart-panel.component';

type Granularite = 'jour' | 'mois' | 'annee';

interface ResumeBanque {
  referenceBancaire: string;
  nombreEtudiants: number;
  nombrePaiements: number;
  montantTotal: number;
}

interface PointEvolution {
  periode: string;
  referenceBancaire: string;
  nombreEtudiants: number;
  montantTotal: number;
}

interface StatistiquesBancaires {
  totalEtudiants: number;
  nombrePaiements: number;
  montantTotal: number;
  parBanque: ResumeBanque[];
  evolution: PointEvolution[];
}

const COULEURS_BANQUES: Record<string, string> = {
  'ORABANK-TG116': '#ef4444',
  'IB BANK -TG024': '#3b82f6',
  'ECOBANK TG055': '#10b981',
};

@Component({
  selector: 'app-analyse-bancaire-page',
  templateUrl: './analyse-bancaire-page.component.html',
  styleUrls: ['./analyse-bancaire-page.component.scss']
})
export class AnalyseBancairePageComponent extends BaseComponentClass implements OnInit {
  readonly banques = BORDEREAU_BANK_REFERENCES;
  readonly granularites: Array<{ value: Granularite; label: string }> = [
    { value: 'jour', label: 'Par jour' },
    { value: 'mois', label: 'Par mois' },
    { value: 'annee', label: 'Par année' }
  ];

  dateDebut = '';
  dateFin = '';
  granularite: Granularite = 'mois';
  loading = false;
  errorMessage = '';
  statistiques?: StatistiquesBancaires;
  chartLabels: string[] = [];
  etudiantsPayload?: ChartPanelPayload;
  montantsPayload?: ChartPanelPayload;

  constructor(private suiviRecouvrementService: SuiviRecouvrementService) {
    super();
  }

  ngOnInit(): void {
    const aujourdHui = this.dateLocale(new Date());
    this.dateFin = aujourdHui;
    this.dateDebut = `${aujourdHui.slice(0, 4)}-01-01`;
    this.loadStatistiques();
  }

  appliquerFiltres(): void {
    if (!this.dateDebut || !this.dateFin || this.dateDebut > this.dateFin) {
      this.errorMessage = 'Sélectionnez une période valide.';
      return;
    }
    this.loadStatistiques();
  }

  formatCurrency(value: number | undefined | null): string {
    return `${new Intl.NumberFormat('fr-FR').format(Number(value) || 0)} FCFA`;
  }

  get nomGranularite(): string {
    return this.granularites.find(item => item.value === this.granularite)?.label.toLowerCase() || 'par mois';
  }

  private loadStatistiques(): void {
    this.loading = true;
    this.errorMessage = '';
    this.suiviRecouvrementService.getStatistiquesBancaires(this.dateDebut, this.dateFin, this.granularite).subscribe({
      next: (response: any) => {
        if (!response?.success || !response.data) {
          this.errorMessage = response?.message || 'Les statistiques bancaires sont indisponibles.';
          this.statistiques = undefined;
          this.loading = false;
          return;
        }
        this.statistiques = this.normaliserStatistiques(response.data);
        this.construireGraphiques(this.statistiques);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Erreur lors du chargement des statistiques bancaires.';
        this.statistiques = undefined;
        this.loading = false;
      }
    });
  }

  private normaliserStatistiques(data: any): StatistiquesBancaires {
    const parBanque = Array.isArray(data.parBanque) ? data.parBanque : [];
    const evolution = Array.isArray(data.evolution) ? data.evolution : [];
    return {
      totalEtudiants: Number(data.totalEtudiants) || 0,
      nombrePaiements: Number(data.nombrePaiements) || 0,
      montantTotal: Number(data.montantTotal) || 0,
      parBanque: this.banques.map(referenceBancaire => {
        const row = parBanque.find((item: any) => item.referenceBancaire === referenceBancaire) || {};
        return {
          referenceBancaire,
          nombreEtudiants: Number(row.nombreEtudiants) || 0,
          nombrePaiements: Number(row.nombrePaiements) || 0,
          montantTotal: Number(row.montantTotal) || 0,
        };
      }),
      evolution: evolution.map((item: any) => ({
        periode: String(item.periode),
        referenceBancaire: String(item.referenceBancaire),
        nombreEtudiants: Number(item.nombreEtudiants) || 0,
        montantTotal: Number(item.montantTotal) || 0,
      }))
    };
  }

  private construireGraphiques(data: StatistiquesBancaires): void {
    const periodes = this.genererPeriodes();
    this.chartLabels = periodes.map(periode => this.formaterPeriode(periode));
    const points = new Map(data.evolution.map(point => [`${point.periode}|${point.referenceBancaire}`, point]));
    const datasets = (metric: 'nombreEtudiants' | 'montantTotal') => this.banques.map(referenceBancaire => ({
      label: referenceBancaire,
      data: periodes.map(periode => points.get(`${periode}|${referenceBancaire}`)?.[metric] || 0)
    }));

    this.etudiantsPayload = {
      type: 'line',
      labels: this.chartLabels,
      datasets: datasets('nombreEtudiants'),
      colors: this.banques.map(banque => COULEURS_BANQUES[banque])
    };
    this.montantsPayload = {
      type: 'line',
      labels: this.chartLabels,
      datasets: datasets('montantTotal'),
      colors: this.banques.map(banque => COULEURS_BANQUES[banque])
    };
  }

  private genererPeriodes(): string[] {
    const debut = this.lireDate(this.dateDebut);
    const fin = this.lireDate(this.dateFin);
    if (!debut || !fin) return [];

    if (this.granularite === 'mois') debut.setDate(1);
    if (this.granularite === 'annee') {
      debut.setMonth(0, 1);
    }

    const periodes: string[] = [];
    while (debut <= fin) {
      periodes.push(this.clePeriode(debut));
      if (this.granularite === 'jour') debut.setDate(debut.getDate() + 1);
      if (this.granularite === 'mois') debut.setMonth(debut.getMonth() + 1);
      if (this.granularite === 'annee') debut.setFullYear(debut.getFullYear() + 1);
    }
    return periodes;
  }

  private clePeriode(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    if (this.granularite === 'annee') return String(annee);
    if (this.granularite === 'mois') return `${annee}-${mois}`;
    return `${annee}-${mois}-${jour}`;
  }

  private formaterPeriode(periode: string): string {
    if (this.granularite === 'annee') return periode;
    if (this.granularite === 'mois') {
      const [annee, mois] = periode.split('-');
      return `${mois}/${annee}`;
    }
    const [annee, mois, jour] = periode.split('-');
    return `${jour}/${mois}/${annee}`;
  }

  private lireDate(value: string): Date | null {
    const [annee, mois, jour] = value.split('-').map(Number);
    const date = new Date(annee, mois - 1, jour);
    return date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour
      ? date
      : null;
  }

  private dateLocale(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
  }
}

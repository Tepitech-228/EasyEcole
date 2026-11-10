import { Component, OnInit } from '@angular/core';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';
import {
  GranulariteRecouvrement,
  SuiviRecouvrementData,
  SuiviRecouvrementService
} from 'src/app/data/modules/inscription/services/suivi-recouvrement.service';

@Component({
  selector: 'app-suivi-recouvrement-page',
  templateUrl: './suivi-recouvrement-page.component.html',
  styleUrls: ['./suivi-recouvrement-page.component.scss']
})
export class SuiviRecouvrementPageComponent implements OnInit {
  data: SuiviRecouvrementData | null = null;
  loading = false;
  error: string | null = null;
  granularite: GranulariteRecouvrement = 'jour';
  dateDebut = this.formatDate(this.offsetDate(new Date(), -29));
  dateFin = this.formatDate(new Date());

  private readonly chartColors = [
    '#4f46e5', '#0f766e', '#ea580c', '#2563eb', '#be123c',
    '#7c3aed', '#15803d', '#a16207', '#0369a1', '#c026d3'
  ];

  readonly optionsGraphique: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  readonly optionsGraphiqueEvolution: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' }
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  readonly optionsGraphiqueComptes: any = {
    ...this.optionsGraphique,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { ticks: { precision: 0 } }
    }
  };

  constructor(private suiviService: SuiviRecouvrementService) { }

  ngOnInit(): void {
    this.chargerSuivi();
  }

  chargerSuivi(): void {
    if (!this.dateDebut || !this.dateFin || this.dateDebut > this.dateFin) {
      this.error = 'La date de début doit précéder ou être égale à la date de fin.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.suiviService.getSuivi(this.dateDebut, this.dateFin, this.granularite)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: response => {
          this.data = response.data;
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.message || 'Impossible de charger le suivi des recouvrements.';
          this.loading = false;
        }
      });
  }

  get graphiqueComptes(): any {
    return {
      labels: this.data?.parCompte.map(compte => compte.nomComplet) || [],
      datasets: [{
        label: 'Recouvrements',
        data: this.data?.parCompte.map(compte => compte.nombreRecouvrements) || [],
        backgroundColor: '#4f46e5',
        borderRadius: 6
      }]
    };
  }

  get graphiqueEvolution(): any {
    return {
      labels: this.data?.evolution.map(point => this.formaterDate(point.date)) || [],
      datasets: (this.data?.parCompte || []).map((compte, index) => {
        const color = this.chartColors[index % this.chartColors.length];
        return {
          label: compte.nomComplet,
          data: (this.data?.evolution || []).map(point => point.comptes[String(compte.utilisateurId)] || 0),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        };
      })
    };
  }

  get frequenceLabel(): string {
    return this.granularite === 'semaine' ? 'par semaine' : 'par jour';
  }

  formaterDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private offsetDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

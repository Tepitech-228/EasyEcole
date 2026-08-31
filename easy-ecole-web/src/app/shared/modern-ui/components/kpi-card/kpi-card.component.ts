import { Component, Input } from '@angular/core';

/**
 * Carte KPI moderne et réutilisable pour les dashboards.
 *
 * Affiche un indicateur clé : icône, libellé, valeur, tendance (+ / - %)
 * et une barre de progression optionnelle (0-100).
 *
 * Usage (dans un template) :
 *   <app-kpi-card
 *     [label]="'Étudiants inscrits'"
 *     [value]="1240"
 *     [trend]="8.5"
 *     [trendDown]="false"
 *     [icon]="'group'"
 *     [color]="'#4f46e5'"
 *     [progress]="72">
 *   </app-kpi-card>
 */
@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent {
  /** Libellé / titre de l'indicateur. */
  @Input() label = '';
  /** Valeur affichée en grand. */
  @Input() value: number | string = 0;
  /** Unité optionnelle (ex. 'FCFA', 'étudiants'). */
  @Input() unit = '';
  /** Variation en % (positive si hausse, négative si baisse). */
  @Input() trend = 0;
  /** true si une baisse est une bonne nouvelle (ex. taux d'impayés). */
  @Input() inverse = false;
  /** Icône Material Symbols. */
  @Input() icon = 'insights';
  /** Couleur d'accent (hex). */
  @Input() color = '#4f46e5';
  /** Progression 0-100 (barre optionnelle, cachée si <= 0). */
  @Input() progress = 0;

  trendUp(): boolean {
    return this.trend >= 0;
  }

  trendGood(): boolean {
    // Une hausse est bonne sauf si inverse ; une baisse est bonne si inverse.
    return this.inverse ? !this.trendUp() : this.trendUp();
  }

  trendClass(): string {
    if (this.trend === 0) {
      return 'text-muted';
    }
    return this.trendGood() ? 'kpi-card__trend--good' : 'kpi-card__trend--bad';
  }

  trendSymbol(): string {
    if (this.trend === 0) {
      return 'trending_flat';
    }
    return this.trendGood() ? 'trending_up' : 'trending_down';
  }
}

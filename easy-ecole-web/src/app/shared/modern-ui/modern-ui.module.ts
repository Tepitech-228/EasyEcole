import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { MaterialModule } from './material.module';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ChartPanelComponent } from './components/chart-panel/chart-panel.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';

/**
 * « Modern UI Kit » — base réutilisable de composants modernes pour les
 * dashboards par rôle :
 *   - KpiCard      : carte d'indicateur clé (titre, valeur, tendance, icône).
 *   - ChartPanel   : carte graphique encapsulant ng2-charts / chart.js.
 *   - DashboardHeader : en-tête de page moderne (titre + badge session).
 *   - MaterialModule : activation Angular Material (cartes, boutons, menus...).
 */
@NgModule({
  declarations: [
    KpiCardComponent,
    ChartPanelComponent,
    DashboardHeaderComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    MaterialModule,
  ],
  exports: [
    KpiCardComponent,
    ChartPanelComponent,
    DashboardHeaderComponent,
    MaterialModule,
  ],
})
export class ModernUiModule { }

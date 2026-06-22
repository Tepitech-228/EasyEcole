import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportingRoutingModule } from './reporting-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardGlobalPageComponent } from './pages/dashboard-global-page/dashboard-global-page.component';
import { RapportEffectifsPageComponent } from './pages/rapport-effectifs-page/rapport-effectifs-page.component';
import { RapportNotesPageComponent } from './pages/rapport-notes-page/rapport-notes-page.component';
import { RapportPaiementsPageComponent } from './pages/rapport-paiements-page/rapport-paiements-page.component';
import { RapportBudgetPageComponent } from './pages/rapport-budget-page/rapport-budget-page.component';
import { RapportRhPageComponent } from './pages/rapport-rh-page/rapport-rh-page.component';
import { RapportStocksPageComponent } from './pages/rapport-stocks-page/rapport-stocks-page.component';
import { RapportImmobilisationsPageComponent } from './pages/rapport-immobilisations-page/rapport-immobilisations-page.component';
import { RapportAchatsPageComponent } from './pages/rapport-achats-page/rapport-achats-page.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { GraphiqueLigneComponent } from './components/graphique-ligne/graphique-ligne.component';
import { GraphiqueBarreComponent } from './components/graphique-barre/graphique-barre.component';
import { ExportPdfButtonComponent } from './components/export-pdf-button/export-pdf-button.component';

@NgModule({
  declarations: [
    DashboardGlobalPageComponent,
    RapportEffectifsPageComponent,
    RapportNotesPageComponent,
    RapportPaiementsPageComponent,
    RapportBudgetPageComponent,
    RapportRhPageComponent,
    RapportStocksPageComponent,
    RapportImmobilisationsPageComponent,
    RapportAchatsPageComponent,
    StatCardComponent,
    GraphiqueLigneComponent,
    GraphiqueBarreComponent,
    ExportPdfButtonComponent
  ],
  imports: [
    CommonModule,
    ReportingRoutingModule,
    SharedModule
  ]
})
export class ReportingModule { }

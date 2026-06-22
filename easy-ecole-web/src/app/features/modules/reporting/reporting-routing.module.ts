import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardGlobalPageComponent } from './pages/dashboard-global-page/dashboard-global-page.component';
import { RapportEffectifsPageComponent } from './pages/rapport-effectifs-page/rapport-effectifs-page.component';
import { RapportNotesPageComponent } from './pages/rapport-notes-page/rapport-notes-page.component';
import { RapportPaiementsPageComponent } from './pages/rapport-paiements-page/rapport-paiements-page.component';
import { RapportBudgetPageComponent } from './pages/rapport-budget-page/rapport-budget-page.component';
import { RapportRhPageComponent } from './pages/rapport-rh-page/rapport-rh-page.component';
import { RapportStocksPageComponent } from './pages/rapport-stocks-page/rapport-stocks-page.component';
import { RapportImmobilisationsPageComponent } from './pages/rapport-immobilisations-page/rapport-immobilisations-page.component';
import { RapportAchatsPageComponent } from './pages/rapport-achats-page/rapport-achats-page.component';

const routes: Routes = [
  {
    path: 'reporting',
    children: [
      {
        path: '',
        component: DashboardGlobalPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'effectifs',
        component: RapportEffectifsPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'notes',
        component: RapportNotesPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'paiements',
        component: RapportPaiementsPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'budget',
        component: RapportBudgetPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'rh',
        component: RapportRhPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'stocks',
        component: RapportStocksPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'immobilisations',
        component: RapportImmobilisationsPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'achats',
        component: RapportAchatsPageComponent,
        pathMatch: 'full'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportingRoutingModule { }

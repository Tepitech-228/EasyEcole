import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCabinetPageComponent } from './pages/dashboard-cabinet-page/dashboard-cabinet-page.component';
import { BordereauxATraiterPageComponent } from './pages/bordereaux-a-traiter-page/bordereaux-a-traiter-page.component';
import { BordereauxValidesPageComponent } from './pages/bordereaux-valides-page/bordereaux-valides-page.component';
import { BordereauxRejetesPageComponent } from './pages/bordereaux-rejetes-page/bordereaux-rejetes-page.component';
import { BordereauxAnomaliesPageComponent } from './pages/bordereaux-anomalies-page/bordereaux-anomalies-page.component';
import { ReferencesBancairesPageComponent } from './pages/references-bancaires-page/references-bancaires-page.component';
import { HistoriqueTraitementsPageComponent } from './pages/historique-traitements-page/historique-traitements-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardCabinetPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bordereaux/a-traiter',
    component: BordereauxATraiterPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bordereaux/valides',
    component: BordereauxValidesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bordereaux/rejetes',
    component: BordereauxRejetesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bordereaux/anomalies',
    component: BordereauxAnomaliesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'references-bancaires',
    component: ReferencesBancairesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'historique',
    component: HistoriqueTraitementsPageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComptabiliteRoutingModule { }

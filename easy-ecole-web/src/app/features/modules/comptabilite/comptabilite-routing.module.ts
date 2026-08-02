import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComptablePageComponent } from './pages/dashboard-comptable-page/dashboard-comptable-page.component';
import { PlanComptablePageComponent } from './pages/plan-comptable-page/plan-comptable-page.component';
import { BalancePageComponent } from './pages/balance-page/balance-page.component';
import { GrandLivrePageComponent } from './pages/grand-livre-page/grand-livre-page.component';
import { EcrituresPageComponent } from './pages/ecritures-page/ecritures-page.component';
import { ComptesBancairesPageComponent } from './pages/comptes-bancaires-page/comptes-bancaires-page.component';
import { RelevesBancairesPageComponent } from './pages/releves-bancaires-page/releves-bancaires-page.component';
import { RapprochementPageComponent } from './pages/rapprochement-page/rapprochement-page.component';
import { ExercicesPageComponent } from './pages/exercices-page/exercices-page.component';
import { BilanPageComponent } from './pages/bilan-page/bilan-page.component';
import { CompteResultatPageComponent } from './pages/compte-resultat-page/compte-resultat-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComptablePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'plan-comptable',
    component: PlanComptablePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'balance',
    component: BalancePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'grand-livre',
    component: GrandLivrePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'ecritures',
    component: EcrituresPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'comptes-bancaires',
    component: ComptesBancairesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'releves-bancaires',
    component: RelevesBancairesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'rapprochement',
    component: RapprochementPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'exercices',
    component: ExercicesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bilan',
    component: BilanPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'compte-resultat',
    component: CompteResultatPageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComptabiliteRoutingModule { }

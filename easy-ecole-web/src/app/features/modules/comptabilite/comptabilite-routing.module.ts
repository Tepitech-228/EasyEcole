import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComptablePageComponent } from './pages/dashboard-comptable-page/dashboard-comptable-page.component';
import { PlanComptablePageComponent } from './pages/plan-comptable-page/plan-comptable-page.component';
import { BalancePageComponent } from './pages/balance-page/balance-page.component';
import { GrandLivrePageComponent } from './pages/grand-livre-page/grand-livre-page.component';
import { EcrituresPageComponent } from './pages/ecritures-page/ecritures-page.component';

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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComptabiliteRoutingModule { }

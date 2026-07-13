import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComptabiliteRoutingModule } from './comptabilite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardComptablePageComponent } from './pages/dashboard-comptable-page/dashboard-comptable-page.component';
import { PlanComptablePageComponent } from './pages/plan-comptable-page/plan-comptable-page.component';
import { BalancePageComponent } from './pages/balance-page/balance-page.component';
import { GrandLivrePageComponent } from './pages/grand-livre-page/grand-livre-page.component';
import { EcrituresPageComponent } from './pages/ecritures-page/ecritures-page.component';

@NgModule({
  declarations: [
    DashboardComptablePageComponent,
    PlanComptablePageComponent,
    BalancePageComponent,
    GrandLivrePageComponent,
    EcrituresPageComponent,
  ],
  imports: [
    CommonModule,
    ComptabiliteRoutingModule,
    SharedModule,
  ]
})
export class ComptabiliteModule { }

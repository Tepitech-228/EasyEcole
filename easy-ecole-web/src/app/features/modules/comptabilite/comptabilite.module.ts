import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptabiliteRoutingModule } from './comptabilite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
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

@NgModule({
  declarations: [
    DashboardComptablePageComponent,
    PlanComptablePageComponent,
    BalancePageComponent,
    GrandLivrePageComponent,
    EcrituresPageComponent,
    ComptesBancairesPageComponent,
    RelevesBancairesPageComponent,
    RapprochementPageComponent,
    ExercicesPageComponent,
    BilanPageComponent,
    CompteResultatPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ComptabiliteRoutingModule,
    SharedModule,
  ]
})
export class ComptabiliteModule { }

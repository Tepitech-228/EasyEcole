import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptabiliteRoutingModule } from './comptabilite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MaterialModule } from 'src/app/shared/modern-ui/material.module';
import { DashboardCabinetPageComponent } from './pages/dashboard-cabinet-page/dashboard-cabinet-page.component';
import { BordereauxATraiterPageComponent } from './pages/bordereaux-a-traiter-page/bordereaux-a-traiter-page.component';
import { BordereauxValidesPageComponent } from './pages/bordereaux-valides-page/bordereaux-valides-page.component';
import { BordereauxRejetesPageComponent } from './pages/bordereaux-rejetes-page/bordereaux-rejetes-page.component';
import { BordereauxAnomaliesPageComponent } from './pages/bordereaux-anomalies-page/bordereaux-anomalies-page.component';
import { ReferencesBancairesPageComponent } from './pages/references-bancaires-page/references-bancaires-page.component';
import { HistoriqueTraitementsPageComponent } from './pages/historique-traitements-page/historique-traitements-page.component';

@NgModule({
  declarations: [
    DashboardCabinetPageComponent,
    BordereauxATraiterPageComponent,
    BordereauxValidesPageComponent,
    BordereauxRejetesPageComponent,
    BordereauxAnomaliesPageComponent,
    ReferencesBancairesPageComponent,
    HistoriqueTraitementsPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ComptabiliteRoutingModule,
    SharedModule,
    MaterialModule,
  ]
})
export class ComptabiliteModule { }

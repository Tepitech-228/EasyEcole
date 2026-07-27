import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarcheRoutingModule } from './marche-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { PlanificationsMarchePageComponent } from './pages/planifications-marche-page/planifications-marche-page.component';
import { ManifestationsInteretPageComponent } from './pages/manifestations-interet-page/manifestations-interet-page.component';
import { AppelsOffrePageComponent } from './pages/appels-offre-page/appels-offre-page.component';
import { ContratsMarchePageComponent } from './pages/contrats-marche-page/contrats-marche-page.component';
import { AvenantsMarchePageComponent } from './pages/avenants-marche-page/avenants-marche-page.component';

@NgModule({
  declarations: [
    PlanificationsMarchePageComponent,
    ManifestationsInteretPageComponent,
    AppelsOffrePageComponent,
    ContratsMarchePageComponent,
    AvenantsMarchePageComponent,
  ],
  imports: [
    CommonModule,
    MarcheRoutingModule,
    SharedModule,
    FormsModule,
  ]
})
export class MarcheModule { }

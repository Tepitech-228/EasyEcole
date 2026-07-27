import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanificationsMarchePageComponent } from './pages/planifications-marche-page/planifications-marche-page.component';
import { ManifestationsInteretPageComponent } from './pages/manifestations-interet-page/manifestations-interet-page.component';
import { AppelsOffrePageComponent } from './pages/appels-offre-page/appels-offre-page.component';
import { ContratsMarchePageComponent } from './pages/contrats-marche-page/contrats-marche-page.component';
import { AvenantsMarchePageComponent } from './pages/avenants-marche-page/avenants-marche-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'planifications', pathMatch: 'full' },
  { path: 'planifications', component: PlanificationsMarchePageComponent },
  { path: 'ami', component: ManifestationsInteretPageComponent },
  { path: 'ao', component: AppelsOffrePageComponent },
  { path: 'contrats', component: ContratsMarchePageComponent },
  { path: 'avenants', component: AvenantsMarchePageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarcheRoutingModule { }

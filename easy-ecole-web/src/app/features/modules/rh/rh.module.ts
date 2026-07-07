import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RhRoutingModule } from './rh-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardRhPageComponent } from './pages/dashboard-rh-page/dashboard-rh-page.component';
import { ListeEmployesPageComponent } from './pages/liste-employes-page/liste-employes-page.component';
import { EmployeDetailsPageComponent } from './pages/employe-details-page/employe-details-page.component';
import { ListeOffresPageComponent } from './pages/liste-offres-page/liste-offres-page.component';
import { OffreDetailsPageComponent } from './pages/offre-details-page/offre-details-page.component';
import { ListeCandidaturesPageComponent } from './pages/liste-candidatures-page/liste-candidatures-page.component';
import { CandidatureDetailsPageComponent } from './pages/candidature-details-page/candidature-details-page.component';
import { ListeFormationsPageComponent } from './pages/liste-formations-page/liste-formations-page.component';
import { FormationDetailsPageComponent } from './pages/formation-details-page/formation-details-page.component';
import { ListeEvaluationsPageComponent } from './pages/liste-evaluations-page/liste-evaluations-page.component';
import { EvaluationPageComponent } from './pages/evaluation-page/evaluation-page.component';
import { PaiePageComponent } from './pages/paie-page/paie-page.component';
import { BulletinDetailsPageComponent } from './pages/bulletin-details-page/bulletin-details-page.component';
import { ParametresPaiePageComponent } from './pages/parametres-paie-page/parametres-paie-page.component';
import { PrestationsPageComponent } from './pages/prestations-page/prestations-page.component';
import { ListeContratsPageComponent } from './pages/liste-contrats-page/liste-contrats-page.component';

@NgModule({
  declarations: [
    DashboardRhPageComponent,
    ListeEmployesPageComponent,
    EmployeDetailsPageComponent,
    ListeOffresPageComponent,
    OffreDetailsPageComponent,
    ListeCandidaturesPageComponent,
    CandidatureDetailsPageComponent,
    ListeFormationsPageComponent,
    FormationDetailsPageComponent,
    ListeEvaluationsPageComponent,
    EvaluationPageComponent,
    PaiePageComponent,
    BulletinDetailsPageComponent,
    ParametresPaiePageComponent,
    PrestationsPageComponent,
    ListeContratsPageComponent,
  ],
  imports: [
    CommonModule,
    RhRoutingModule,
    SharedModule,
  ]
})
export class RhModule { }

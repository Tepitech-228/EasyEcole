import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RhRoutingModule } from './rh-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModernUiModule } from 'src/app/shared/modern-ui/modern-ui.module';
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
import { PlanningPersonnelPageComponent } from './pages/planning-personnel-page/planning-personnel-page.component';
import { ListeCategoriesProfessionnellesPageComponent } from './pages/liste-categories-professionnelles-page/liste-categories-professionnelles-page.component';
import { ListeGrillesSalarialesPageComponent } from './pages/liste-grilles-salariales-page/liste-grilles-salariales-page.component';
import { ListeHeuresSupplementairesPageComponent } from './pages/liste-heures-supplementaires-page/liste-heures-supplementaires-page.component';
import { ListePretsPageComponent } from './pages/liste-prets-page/liste-prets-page.component';
import { ListeRemboursementsPretPageComponent } from './pages/liste-remboursements-pret-page/liste-remboursements-pret-page.component';
import { ReportingRhPageComponent } from './pages/reporting-rh-page/reporting-rh-page.component';
import { ListePrestatairesPageComponent } from './pages/liste-prestataires-page/liste-prestataires-page.component';
import { IndemnitesPrestatairePageComponent } from './pages/indemnites-prestataire-page/indemnites-prestataire-page.component';
import { DemandesCongePageComponent } from './pages/demandes-conge-page/demandes-conge-page.component';
import { SoldesCongePageComponent } from './pages/soldes-conge-page/soldes-conge-page.component';

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
    PlanningPersonnelPageComponent,
    ListeCategoriesProfessionnellesPageComponent,
    ListeGrillesSalarialesPageComponent,
    ListeHeuresSupplementairesPageComponent,
    ListePretsPageComponent,
    ListeRemboursementsPretPageComponent,
    ReportingRhPageComponent,
    ListePrestatairesPageComponent,
    IndemnitesPrestatairePageComponent,
    DemandesCongePageComponent,
    SoldesCongePageComponent,
  ],
  imports: [
    CommonModule,
    RhRoutingModule,
    SharedModule,
    ModernUiModule,
  ]
})
export class RhModule { }

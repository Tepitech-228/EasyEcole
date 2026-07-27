import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  {
    path: '',
    component: DashboardRhPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'employes',
    children: [
      {
        path: '',
        component: ListeEmployesPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: EmployeDetailsPageComponent,
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'offres-emploi',
    children: [
      {
        path: '',
        component: ListeOffresPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: OffreDetailsPageComponent,
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'candidatures',
    children: [
      {
        path: '',
        component: ListeCandidaturesPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: CandidatureDetailsPageComponent,
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'formations',
    children: [
      {
        path: '',
        component: ListeFormationsPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: FormationDetailsPageComponent,
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'evaluations',
    children: [
      {
        path: '',
        component: ListeEvaluationsPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'nouvelle',
        component: EvaluationPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: EvaluationPageComponent,
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'paie',
    component: PaiePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'bulletins-paie/:id',
    component: BulletinDetailsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'parametres-paie',
    component: ParametresPaiePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'prestations',
    component: PrestationsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'contrats-enseignant',
    component: ListeContratsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'planning-personnel',
    component: PlanningPersonnelPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'categories-professionnelles',
    component: ListeCategoriesProfessionnellesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'grilles-salariales',
    component: ListeGrillesSalarialesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'heures-supplementaires',
    component: ListeHeuresSupplementairesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'prets',
    component: ListePretsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'remboursements-prets',
    component: ListeRemboursementsPretPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'remboursements-prets/:pretId',
    component: ListeRemboursementsPretPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'reportings',
    component: ReportingRhPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'prestataires',
    component: ListePrestatairesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'indemnites-prestataires',
    component: IndemnitesPrestatairePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'indemnites-prestataires/:prestataireId',
    component: IndemnitesPrestatairePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'demandes-conge',
    children: [
      { path: '', component: DemandesCongePageComponent, pathMatch: 'full' },
      { path: ':id', component: DemandesCongePageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'soldes-conge',
    component: SoldesCongePageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RhRoutingModule { }

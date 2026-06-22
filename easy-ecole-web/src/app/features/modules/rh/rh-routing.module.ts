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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RhRoutingModule { }

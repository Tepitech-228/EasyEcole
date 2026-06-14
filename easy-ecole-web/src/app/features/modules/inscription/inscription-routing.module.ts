import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChoixParcoursPageComponent } from './pages/choix-parcours-page/choix-parcours-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { DetailsParcoursPageComponent } from './pages/details-parcours-page/details-parcours-page.component';
import { DetailsSessionPageComponent } from './pages/details-session-page/details-session-page.component';
import { ListeCoursPageComponent } from './pages/liste-cours-page/liste-cours-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { ListeParcoursPageComponent } from './pages/liste-parcours-page/liste-parcours-page.component';
import { ListeSessionsPageComponent } from './pages/liste-sessions-page/liste-sessions-page.component';
import { MonCursusPageComponent } from './pages/mon-cursus-page/mon-cursus-page.component';
import { NouveauParcoursPageComponent } from './pages/nouveau-parcours-page/nouveau-parcours-page.component';
import { PaiementsPageComponent } from './pages/paiements-page/paiements-page.component';

const routes: Routes = [
  {
    path: 'sessions',
    children: [
      {
        path: '',
        component: ListeSessionsPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        component: DetailsSessionPageComponent,
        pathMatch: 'full'
      },
    ]
  },

  {
    path: 'parcours',
    children: [
      {
        path: '',
        component: ListeParcoursPageComponent,
        pathMatch: 'full'
      },

      {
        path: 'nouveau',
        component: NouveauParcoursPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        component: DetailsParcoursPageComponent,
        pathMatch: 'full'
      },
    ]
  },

  {
    path: 'cours',
    component: ListeCoursPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'demandes',
    children: [
      {
        path: '',
        component: ListeDemandesPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        children: [
          {
            path: '',
            component: DetailsDemandePageComponent,
            pathMatch: 'full'
          },

          {
            path: 'choix-parcours',
            component: ChoixParcoursPageComponent,
            pathMatch: 'full'
          },
        ]
      },
    ]
  },

  {
    path: 'paiements',
    component: PaiementsPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'cursus',
    component: MonCursusPageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InscriptionRoutingModule { }

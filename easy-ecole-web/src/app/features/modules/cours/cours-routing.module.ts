import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListeEnseignantsPageComponent } from './pages/liste-enseignants-page/liste-enseignants-page.component';
import { ListeCoursPageComponent } from './pages/liste-cours-page/liste-cours-page.component';
import { DetailsEnseignantPageComponent } from './pages/details-enseignant-page/details-enseignant-page.component';
import { DetailsCoursPageComponent } from './pages/details-cours-page/details-cours-page.component';
import { NouvelleRessourcePageComponent } from './pages/nouvelle-ressource-page/nouvelle-ressource-page.component';
import { NouveauChapitrePageComponent } from './pages/nouveau-chapitre-page/nouveau-chapitre-page.component';
import { DetailsChapitrePageComponent } from './pages/details-chapitre-page/details-chapitre-page.component';
import { ModificationChapitrePageComponent } from './pages/modification-chapitre-page/modification-chapitre-page.component';
import { ModificationRessourcePageComponent } from './pages/modification-ressource-page/modification-ressource-page.component';
import { ListePresencesPageComponent } from './pages/liste-presences-page/liste-presences-page.component';
import { ListeNotesPageComponent } from './pages/liste-notes-page/liste-notes-page.component';
import { ListeEmploisDuTempsPageComponent } from './pages/liste-emplois-du-temps-page/liste-emplois-du-temps-page.component';
import { ListeCahiersDeTextePageComponent } from './pages/liste-cahiers-de-texte-page/liste-cahiers-de-texte-page.component';
import { DetailsPresencePageComponent } from './pages/details-presence-page/details-presence-page.component';
import { DetailsCahierDeTextePageComponent } from './pages/details-cahier-de-texte-page/details-cahier-de-texte-page.component';

const routes: Routes = [
  {
    // Cours
    path: 'cours',
    children: [
      {
        path: '',
        component: ListeCoursPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        children: [
          {
            path: '',
            component: DetailsCoursPageComponent,
            pathMatch: 'full',
          },

          {
            path: 'chapitres',
            children: [
              {
                path: '',
                redirectTo: '..',
                pathMatch: 'full',
              },

              {
                path: 'new',
                component: NouveauChapitrePageComponent,
                pathMatch: 'full'
              },

              {
                path: ':chapitre',
                children: [
                  {
                    path: '',
                    component: DetailsChapitrePageComponent,
                    pathMatch: 'full',
                  },

                  {
                    path: 'modification',
                    component: ModificationChapitrePageComponent,
                    pathMatch: 'full',
                  },

                  {
                    path: 'ressources',
                    children: [
                      {
                        path: 'new',
                        component: NouvelleRessourcePageComponent,
                        pathMatch: 'full'
                      },

                      {
                        path: ':ressource',
                        children: [
                          {
                            path: 'modification',
                            component: ModificationRessourcePageComponent,
                            pathMatch: 'full',
                          },
                        ]
                      },
                    ]
                  },
                ]
              },
            ]
          },
        ]
      },
    ],
  },

  // Présences
  {
    path: 'presences',
    children: [
      {
        path: '',
        component: ListePresencesPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        component: DetailsPresencePageComponent,
        pathMatch: 'full'
      },
    ],
  },

  // Cahiers de texte
  {
    path: 'cahiers-de-texte',
    children: [
      {
        path: '',
        component: ListeCahiersDeTextePageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        component: DetailsCahierDeTextePageComponent,
        pathMatch: 'full'
      },
    ],
  },

  // Emplois du temps
  {
    path: 'emplois-du-temps',
    children: [
      {
        path: '',
        component: ListeEmploisDuTempsPageComponent,
        pathMatch: 'full'
      },
    ],
  },

  // Notes d'évaluation
  {
    path: 'notes',
    children: [
      {
        path: '',
        component: ListeNotesPageComponent,
        pathMatch: 'full'
      },
    ],
  },

  // Enseignants
  {
    path: 'enseignants',
    children: [
      {
        path: '',
        component: ListeEnseignantsPageComponent,
        pathMatch: 'full'
      },

      {
        path: ':id',
        component: DetailsEnseignantPageComponent,
        pathMatch: 'full'
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoursRoutingModule { }

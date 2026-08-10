import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChoixParcoursPageComponent } from './pages/choix-parcours-page/choix-parcours-page.component';
import { ChoixCoursPageComponent } from './pages/choix-cours-page/choix-cours-page.component';
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
import { BordereauxPageComponent } from './pages/bordereaux-page/bordereaux-page.component';
import { ValidationBordereauxPageComponent } from './pages/validation-bordereaux-page/validation-bordereaux-page.component';
import { MonDossierPageComponent } from './pages/mon-dossier-page/mon-dossier-page.component';
import { GestionEcheancesPageComponent } from './pages/gestion-echeances-page/gestion-echeances-page.component';
import { ComiteOrientationPageComponent } from './pages/comite-orientation-page/comite-orientation-page.component';
import { ComiteDetailsPageComponent } from './pages/comite-details-page/comite-details-page.component';
import { ListeDossiersPageComponent } from './pages/liste-dossiers-page/liste-dossiers-page.component';
import { ListeFraisParcoursPageComponent } from './pages/liste-frais-parcours-page/liste-frais-parcours-page.component';
import { HierarchyPageComponent } from './pages/hierarchy/hierarchy-page.component';
import { HierarchyDossiersPageComponent } from './pages/hierarchy-dossiers-page/hierarchy-dossiers-page.component';
import { ListeEffectifsPageComponent } from './pages/liste-effectifs-page/liste-effectifs-page.component';
import { SuiviUePageComponent } from './pages/suivi-ue-page/suivi-ue-page.component';
import { ListeSallesDeClassePageComponent } from './pages/liste-salles-de-classe-page/liste-salles-de-classe-page.component';
import { ListeClassesPageComponent } from './pages/liste-classes-page/liste-classes-page.component';
import { OnboardingPageComponent } from './pages/onboarding-page/onboarding-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';
import { GestionSemestresPageComponent } from './pages/gestion-semestres-page/gestion-semestres-page.component';
import { ImportExportExcelPageComponent } from './pages/import-export-excel-page/import-export-excel-page.component';

const routes: Routes = [
  {
    path: 'onboarding',
    component: OnboardingPageComponent,
    pathMatch: 'full'
  },
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
    path: 'frais-parcours',
    component: ListeFraisParcoursPageComponent,
    pathMatch: 'full'
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

          {
            path: 'choix-cours',
            component: ChoixCoursPageComponent,
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

  {
    path: 'suivi-ue',
    component: SuiviUePageComponent,
    pathMatch: 'full'
  },

  {
    path: 'bordereaux',
    component: BordereauxPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'validation-bordereaux',
    component: ValidationBordereauxPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'mon-dossier',
    component: MonDossierPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'dossiers',
    component: ListeDossiersPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'cartes',
    component: CartesPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'semestres',
    component: GestionSemestresPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'effectifs',
    component: ListeEffectifsPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'hierarchy',
    component: HierarchyPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'hierarchy-dossiers',
    component: HierarchyDossiersPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'echeances',
    component: GestionEcheancesPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'salles-de-classe',
    component: ListeSallesDeClassePageComponent,
    pathMatch: 'full'
  },

  {
    path: 'classes',
    component: ListeClassesPageComponent,
    pathMatch: 'full'
  },

  {
    path: 'comite-orientation',
    children: [
      {
        path: '',
        component: ComiteOrientationPageComponent,
        pathMatch: 'full'
      },
      {
        path: ':id',
        component: ComiteDetailsPageComponent,
        pathMatch: 'full'
      }
    ]
  },

  {
    path: 'import-export-excel',
    component: ImportExportExcelPageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InscriptionRoutingModule { }

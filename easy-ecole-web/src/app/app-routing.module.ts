import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseLayoutComponent } from './features/layout/layouts/base-layout/base-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { NotFoundPageComponent } from './features/pages/not-found-page/not-found-page.component';
import { DashboardPageComponent } from './features/pages/dashboard-page/dashboard-page.component';

const routes: Routes = [
  { path: 'test', redirectTo: '', pathMatch: 'full' },

  // Auth
  {
    path: 'auth',
    loadChildren: () => import('./features/modules/auth/auth.module').then(m => m.AuthModule),
  },

  // Dashboard
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          {
            path: '',
            component: DashboardPageComponent,
            pathMatch: 'full',
          }
        ]
      },

      // Module "Orientation"
      {
        path: 'orientation',
        loadChildren: () => import('./features/modules/orientation/orientation.module').then(m => m.OrientationModule),
        // canLoad: [AuthGuard]
      },

      // Module "Inscription"
      {
        path: 'inscription',
        loadChildren: () => import('./features/modules/inscription/inscription.module').then(m => m.InscriptionModule),
        canLoad: [AuthGuard]
      },

      // Module "Cours"
      {
        path: 'cours',
        loadChildren: () => import('./features/modules/cours/cours.module').then(m => m.CoursModule),
        canLoad: [AuthGuard]
      },

      // Module "Bulletins"
      {
        path: 'bulletins',
        loadChildren: () => import('./features/modules/bulletins/bulletins.module').then(m => m.BulletinsModule),
        canLoad: [AuthGuard]
      },

      // Module "Parametres"
      {
        path: 'parametres',
        loadChildren: () => import('./features/modules/parametres/parametres.module').then(m => m.ParametresModule),
        canLoad: [AuthGuard]
      },

      // Module "Stages"
      {
        path: 'stages',
        loadChildren: () => import('./features/modules/stages/stages.module').then(m => m.StagesModule),
        canLoad: [AuthGuard]
      },

      // Module "Stocks"
      {
        path: 'stocks',
        loadChildren: () => import('./features/modules/stocks/stocks.module').then(m => m.StocksModule),
        canLoad: [AuthGuard]
      },

      // Module "Immobilisations"
      {
        path: 'immobilisations',
        loadChildren: () => import('./features/modules/immobilisations/immobilisations.module').then(m => m.ImmobilisationsModule),
        canLoad: [AuthGuard]
      },

      // Module "Administration"
      {
        path: 'administration',
        loadChildren: () => import('./features/modules/administration/administration.module').then(m => m.AdministrationModule),
        canLoad: [AuthGuard]
      },

      // Module "Achats"
      {
        path: 'achats',
        loadChildren: () => import('./features/modules/achats/achats.module').then(m => m.AchatsModule),
        canLoad: [AuthGuard]
      },

      // Module "Pointage"
      {
        path: 'pointage',
        loadChildren: () => import('./features/modules/pointage/pointage.module').then(m => m.PointageModule),
        canLoad: [AuthGuard]
      },

      // Module "GED"
      {
        path: 'ged',
        loadChildren: () => import('./features/modules/ged/ged.module').then(m => m.GedModule),
        canLoad: [AuthGuard]
      },

      // Module "Ressources Humaines"
      {
        path: 'rh',
        loadChildren: () => import('./features/modules/rh/rh.module').then(m => m.RhModule),
        canLoad: [AuthGuard]
      },

      // Module "Reporting"
      {
        path: 'reporting',
        loadChildren: () => import('./features/modules/reporting/reporting.module').then(m => m.ReportingModule),
        canLoad: [AuthGuard]
      },

      // Module "Communication"
      {
        path: 'communication',
        loadChildren: () => import('./features/modules/communication/communication.module').then(m => m.CommunicationModule),
        canLoad: [AuthGuard]
      },

      // Module "Scolarite"
      {
        path: 'scolarite',
        loadChildren: () => import('./features/modules/scolarite/scolarite.module').then(m => m.ScolariteModule),
        canLoad: [AuthGuard]
      },

      // Module "E-learning"
      {
        path: 'elearning',
        loadChildren: () => import('./features/modules/elearning/elearning.module').then(m => m.ElearningModule),
        canLoad: [AuthGuard]
      },

      // Module "Comptabilite"
      {
        path: 'comptabilite',
        loadChildren: () => import('./features/modules/comptabilite/comptabilite.module').then(m => m.ComptabiliteModule),
        canLoad: [AuthGuard]
      },
    ]
  },

  // Not found
  // TODO:: Page 404
  {
    path: '**',
    component: NotFoundPageComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

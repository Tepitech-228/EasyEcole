import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeParcoursPageComponent } from './pages/liste-parcours-page/liste-parcours-page.component';
import { DetailsParcoursPageComponent } from './pages/details-parcours-page/details-parcours-page.component';
import { NouveauParcoursPageComponent } from './pages/nouveau-parcours-page/nouveau-parcours-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

const routes: Routes = [
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
        canActivateChild: [AuthGuard],
        children: [
          { 
            path: '',
            component: NouveauParcoursPageComponent,
            pathMatch: 'full'
          },
        ]
      },

      { 
        path: ':id',
        component: DetailsParcoursPageComponent,
        pathMatch: 'full'
      },
    ]
  },

  {
    path: 'demandes',
    canActivateChild: [AuthGuard],
    children: [
      { 
        path: '',
        component: ListeDemandesPageComponent,
        pathMatch: 'full'
      },
    
      { 
        path: ':id',
        component: DetailsDemandePageComponent,
        pathMatch: 'full'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrientationRoutingModule { }

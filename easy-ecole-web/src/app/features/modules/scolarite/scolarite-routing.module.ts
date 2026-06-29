import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DemandesDocumentsPageComponent } from './pages/demandes-documents-page/demandes-documents-page.component';
import { TraiterDemandesPageComponent } from './pages/traiter-demandes-page/traiter-demandes-page.component';
import { MesReclamationsPageComponent } from './pages/mes-reclamations-page/mes-reclamations-page.component';
import { TraiterReclamationsPageComponent } from './pages/traiter-reclamations-page/traiter-reclamations-page.component';
import { RegistresPageComponent } from './pages/registres-page/registres-page.component';
import { CalendrierPageComponent } from './pages/calendrier-page/calendrier-page.component';
import { DisciplinePageComponent } from './pages/discipline-page/discipline-page.component';
import { ConseilsPageComponent } from './pages/conseils-page/conseils-page.component';

const routes: Routes = [
  {
    path: 'demandes-documents',
    component: DemandesDocumentsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'traiter-demandes',
    component: TraiterDemandesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'mes-reclamations',
    component: MesReclamationsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'traiter-reclamations',
    component: TraiterReclamationsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'registres',
    component: RegistresPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'calendrier',
    component: CalendrierPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'discipline',
    component: DisciplinePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'conseils',
    component: ConseilsPageComponent,
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'demandes-documents',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScolariteRoutingModule { }

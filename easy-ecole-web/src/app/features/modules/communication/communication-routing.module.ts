import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SuggestionsPageComponent } from './pages/suggestions-page/suggestions-page.component';
import { TraitementSuggestionsPageComponent } from './pages/traitement-suggestions-page/traitement-suggestions-page.component';
import { VieEstudiantinePageComponent } from './pages/vie-estudiantine-page/vie-estudiantine-page.component';
import { GestionCommunicationsPageComponent } from './pages/gestion-communications-page/gestion-communications-page.component';

const routes: Routes = [
  {
    path: 'suggestions',
    component: SuggestionsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'traitement-suggestions',
    component: TraitementSuggestionsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'vie-estudiantine',
    component: VieEstudiantinePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'gestion-communications',
    component: GestionCommunicationsPageComponent,
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'vie-estudiantine',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommunicationRoutingModule { }

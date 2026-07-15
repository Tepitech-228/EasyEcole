import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SuggestionsPageComponent } from './pages/suggestions-page/suggestions-page.component';
import { TraitementSuggestionsPageComponent } from './pages/traitement-suggestions-page/traitement-suggestions-page.component';
import { VieEstudiantinePageComponent } from './pages/vie-estudiantine-page/vie-estudiantine-page.component';
import { GestionCommunicationsPageComponent } from './pages/gestion-communications-page/gestion-communications-page.component';

import { AnnoncesPageComponent } from './pages/annonces-page/annonces-page.component';
import { NouvelleAnnoncePageComponent } from './pages/nouvelle-annonce-page/nouvelle-annonce-page.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { DiscussionsPageComponent } from './pages/discussions-page/discussions-page.component';

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
    path: 'messagerie',
    redirectTo: 'discussions',
    pathMatch: 'full'
  },
  {
    path: 'messagerie/nouveau',
    redirectTo: 'discussions',
    pathMatch: 'full'
  },
  {
    path: 'messagerie/:id',
    redirectTo: 'discussions',
    pathMatch: 'full'
  },
  {
    path: 'annonces',
    component: AnnoncesPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'annonces/nouveau',
    component: NouvelleAnnoncePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'notifications',
    component: NotificationsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'discussions',
    component: DiscussionsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'invitation/:code',
    component: DiscussionsPageComponent,
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

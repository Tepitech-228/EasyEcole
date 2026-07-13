import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SuggestionsPageComponent } from './pages/suggestions-page/suggestions-page.component';
import { TraitementSuggestionsPageComponent } from './pages/traitement-suggestions-page/traitement-suggestions-page.component';
import { VieEstudiantinePageComponent } from './pages/vie-estudiantine-page/vie-estudiantine-page.component';
import { GestionCommunicationsPageComponent } from './pages/gestion-communications-page/gestion-communications-page.component';
import { MessageriePageComponent } from './pages/messagerie-page/messagerie-page.component';
import { NouveauMessagePageComponent } from './pages/nouveau-message-page/nouveau-message-page.component';
import { MessageDetailPageComponent } from './pages/message-detail-page/message-detail-page.component';
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
    component: MessageriePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'messagerie/nouveau',
    component: NouveauMessagePageComponent,
    pathMatch: 'full'
  },
  {
    path: 'messagerie/:id',
    component: MessageDetailPageComponent,
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

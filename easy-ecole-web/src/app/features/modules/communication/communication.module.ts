import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommunicationRoutingModule } from './communication-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
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

@NgModule({
  declarations: [
    SuggestionsPageComponent,
    TraitementSuggestionsPageComponent,
    VieEstudiantinePageComponent,
    GestionCommunicationsPageComponent,
    MessageriePageComponent,
    NouveauMessagePageComponent,
    MessageDetailPageComponent,
    AnnoncesPageComponent,
    NouvelleAnnoncePageComponent,
    NotificationsPageComponent,
    DiscussionsPageComponent
  ],
  imports: [
    CommonModule,
    CommunicationRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CommunicationModule { }

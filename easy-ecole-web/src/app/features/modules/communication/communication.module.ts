import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommunicationRoutingModule } from './communication-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SuggestionsPageComponent } from './pages/suggestions-page/suggestions-page.component';
import { TraitementSuggestionsPageComponent } from './pages/traitement-suggestions-page/traitement-suggestions-page.component';
import { VieEstudiantinePageComponent } from './pages/vie-estudiantine-page/vie-estudiantine-page.component';
import { GestionCommunicationsPageComponent } from './pages/gestion-communications-page/gestion-communications-page.component';

@NgModule({
  declarations: [
    SuggestionsPageComponent,
    TraitementSuggestionsPageComponent,
    VieEstudiantinePageComponent,
    GestionCommunicationsPageComponent
  ],
  imports: [
    CommonModule,
    CommunicationRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class CommunicationModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoursRoutingModule } from './cours-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeEnseignantsPageComponent } from './pages/liste-enseignants-page/liste-enseignants-page.component';
import { ListeCoursPageComponent } from './pages/liste-cours-page/liste-cours-page.component';
import { DetailsEnseignantPageComponent } from './pages/details-enseignant-page/details-enseignant-page.component';
import { DetailsCoursPageComponent } from './pages/details-cours-page/details-cours-page.component';
import { RessourceCardComponent } from './components/ressource-card/ressource-card.component';
import { NouvelleRessourcePageComponent } from './pages/nouvelle-ressource-page/nouvelle-ressource-page.component';
import { ChapitreCardComponent } from './components/chapitre-card/chapitre-card.component';
import { ListeRessourcesPageComponent } from './pages/liste-ressources-page/liste-ressources-page.component';
import { NouveauChapitrePageComponent } from './pages/nouveau-chapitre-page/nouveau-chapitre-page.component';
import { QuillModule } from 'ngx-quill';
import { DetailsChapitrePageComponent } from './pages/details-chapitre-page/details-chapitre-page.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AjoutFichierRessourceComponent } from './components/ajout-fichier-ressource/ajout-fichier-ressource.component';
import { ModificationChapitrePageComponent } from './pages/modification-chapitre-page/modification-chapitre-page.component';
import { ModificationRessourcePageComponent } from './pages/modification-ressource-page/modification-ressource-page.component';
import { ListePresencesPageComponent } from './pages/liste-presences-page/liste-presences-page.component';
import { ListeNotesPageComponent } from './pages/liste-notes-page/liste-notes-page.component';
import { ListeCahiersDeTextePageComponent } from './pages/liste-cahiers-de-texte-page/liste-cahiers-de-texte-page.component';
import { ListeEmploisDuTempsPageComponent } from './pages/liste-emplois-du-temps-page/liste-emplois-du-temps-page.component';
import { DetailsPresencePageComponent } from './pages/details-presence-page/details-presence-page.component';
import { DetailsCahierDeTextePageComponent } from './pages/details-cahier-de-texte-page/details-cahier-de-texte-page.component';

@NgModule({
  declarations: [
    ListeEnseignantsPageComponent,
    ListeCoursPageComponent,
    DetailsEnseignantPageComponent,
    DetailsCoursPageComponent,
    RessourceCardComponent,
    NouvelleRessourcePageComponent,
    ChapitreCardComponent,
    ListeRessourcesPageComponent,
    NouveauChapitrePageComponent,
    DetailsChapitrePageComponent,
    AjoutFichierRessourceComponent,
    ModificationChapitrePageComponent,
    ModificationRessourcePageComponent,
    ListePresencesPageComponent,
    ListeNotesPageComponent,
    ListeCahiersDeTextePageComponent,
    ListeEmploisDuTempsPageComponent,
    DetailsPresencePageComponent,
    DetailsCahierDeTextePageComponent
  ],
  imports: [
    CommonModule,
    CoursRoutingModule,
    SharedModule,
    QuillModule.forRoot(),
    FullCalendarModule
  ]
})
export class CoursModule { }

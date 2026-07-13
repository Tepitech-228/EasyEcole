import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrientationRoutingModule } from './orientation-routing.module';
import { ListeParcoursPageComponent } from './pages/liste-parcours-page/liste-parcours-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ParcoursCardComponent } from './components/parcours-card/parcours-card.component';
import { NouveauParcoursPageComponent } from './pages/nouveau-parcours-page/nouveau-parcours-page.component';
import { DetailsParcoursPageComponent } from './pages/details-parcours-page/details-parcours-page.component';
import { QuillModule } from 'ngx-quill';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { AjoutDeboucheComponent } from './components/ajout-debouche/ajout-debouche.component';
import { TraitementDemandeComponent } from './components/traitement-demande/traitement-demande.component';


@NgModule({
  declarations: [
    ListeParcoursPageComponent,
    ParcoursCardComponent,
    NouveauParcoursPageComponent,
    DetailsParcoursPageComponent,
    DetailsDemandePageComponent,
    ListeDemandesPageComponent,
    AjoutDeboucheComponent,
    TraitementDemandeComponent
  ],
  imports: [
    CommonModule,
    OrientationRoutingModule,
    SharedModule,
    QuillModule.forRoot()
  ]
})
export class OrientationModule { }

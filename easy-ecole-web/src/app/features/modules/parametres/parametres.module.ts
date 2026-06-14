import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ParametresRoutingModule } from './parametres-routing.module';
import { MonComptePageComponent } from './pages/mon-compte-page/mon-compte-page.component';
import { MonProfilPageComponent } from './pages/mon-profil-page/mon-profil-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ParametresSectionComponent } from './components/parametres-section/parametres-section.component';


@NgModule({
  declarations: [
    MonComptePageComponent,
    MonProfilPageComponent,
    ParametresSectionComponent
  ],
  imports: [
    CommonModule,
    ParametresRoutingModule,
    SharedModule,
  ]
})
export class ParametresModule { }

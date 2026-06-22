import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ScolariteRoutingModule } from './scolarite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DemandesDocumentsPageComponent } from './pages/demandes-documents-page/demandes-documents-page.component';
import { TraiterDemandesPageComponent } from './pages/traiter-demandes-page/traiter-demandes-page.component';
import { MesReclamationsPageComponent } from './pages/mes-reclamations-page/mes-reclamations-page.component';
import { TraiterReclamationsPageComponent } from './pages/traiter-reclamations-page/traiter-reclamations-page.component';

@NgModule({
  declarations: [
    DemandesDocumentsPageComponent,
    TraiterDemandesPageComponent,
    MesReclamationsPageComponent,
    TraiterReclamationsPageComponent
  ],
  imports: [
    CommonModule,
    ScolariteRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class ScolariteModule { }

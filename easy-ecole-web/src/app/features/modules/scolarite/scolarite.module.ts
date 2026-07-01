import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ScolariteRoutingModule } from './scolarite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DemandesDocumentsPageComponent } from './pages/demandes-documents-page/demandes-documents-page.component';
import { TraiterDemandesPageComponent } from './pages/traiter-demandes-page/traiter-demandes-page.component';
import { MesReclamationsPageComponent } from './pages/mes-reclamations-page/mes-reclamations-page.component';
import { TraiterReclamationsPageComponent } from './pages/traiter-reclamations-page/traiter-reclamations-page.component';
import { RegistresPageComponent } from './pages/registres-page/registres-page.component';
import { CalendrierPageComponent } from './pages/calendrier-page/calendrier-page.component';
import { DisciplinePageComponent } from './pages/discipline-page/discipline-page.component';
import { ConseilsPageComponent } from './pages/conseils-page/conseils-page.component';
import { BibliothequePageComponent } from './pages/bibliotheque-page/bibliotheque-page.component';
import { GestionBibliothequePageComponent } from './pages/gestion-bibliotheque-page/gestion-bibliotheque-page.component';

@NgModule({
  declarations: [
    DemandesDocumentsPageComponent,
    TraiterDemandesPageComponent,
    MesReclamationsPageComponent,
    TraiterReclamationsPageComponent,
    RegistresPageComponent,
    CalendrierPageComponent,
    DisciplinePageComponent,
    ConseilsPageComponent,
    BibliothequePageComponent,
    GestionBibliothequePageComponent
  ],
  imports: [
    CommonModule,
    ScolariteRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ScolariteModule { }

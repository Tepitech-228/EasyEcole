import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GedRoutingModule } from './ged-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { GedUploadComponent } from './pages/ged-upload/ged-upload.component';
import { GedNomenclatureComponent } from './pages/ged-nomenclature/ged-nomenclature.component';
import { GedCatalogComponent } from './pages/ged-catalog/ged-catalog.component';
import { GedDocumentPageComponent } from './pages/ged-document-page/ged-document-page.component';
import { GedArchivesComponent } from './pages/ged-archives/ged-archives.component';
import { GedFoldersComponent } from './pages/ged-folders/ged-folders.component';
import { GedSessionsPageComponent } from './pages/ged-sessions/ged-sessions-page.component';
import { GedSessionDetailPageComponent } from './pages/ged-sessions/ged-session-detail-page.component';
import { GedSaisieComponent } from './pages/ged-saisie/ged-saisie.component';

@NgModule({
  declarations: [
    GedUploadComponent,
    GedNomenclatureComponent,
    GedCatalogComponent,
    GedDocumentPageComponent,
    GedArchivesComponent,
    GedFoldersComponent,
    GedSessionsPageComponent,
    GedSessionDetailPageComponent,
    GedSaisieComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    GedRoutingModule
  ]
})
export class GedModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GedRoutingModule } from './ged-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { GedPageComponent } from './pages/ged-page/ged-page.component';
import { GedUploadComponent } from './pages/ged-upload/ged-upload.component';
import { GedNomenclatureComponent } from './pages/ged-nomenclature/ged-nomenclature.component';
import { GedCatalogComponent } from './pages/ged-catalog/ged-catalog.component';
import { GedDocumentPageComponent } from './pages/ged-document-page/ged-document-page.component';
import { GedFoldersComponent } from './pages/ged-folders/ged-folders.component';
import { GedSessionsPageComponent } from './pages/ged-sessions/ged-sessions-page.component';
import { GedSessionDetailPageComponent } from './pages/ged-sessions/ged-session-detail-page.component';

@NgModule({
  declarations: [
    GedPageComponent,
    GedUploadComponent,
    GedNomenclatureComponent,
    GedCatalogComponent,
    GedDocumentPageComponent,
    GedFoldersComponent,
    GedSessionsPageComponent,
    GedSessionDetailPageComponent
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

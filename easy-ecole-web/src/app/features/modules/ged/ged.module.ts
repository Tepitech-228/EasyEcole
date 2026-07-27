import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GedRoutingModule } from './ged-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { GedCourrierComponent } from './pages/ged-courrier/ged-courrier.component';
import { GedMergeComponent } from './pages/ged-merge/ged-merge.component';
import { GedCatalogComponent } from './pages/ged-catalog/ged-catalog.component';
import { GedDocumentPageComponent } from './pages/ged-document-page/ged-document-page.component';
import { GedArchivesComponent } from './pages/ged-archives/ged-archives.component';
import { GedDisposalComponent } from './pages/ged-disposal/ged-disposal.component';
import { GedSearchComponent } from './pages/ged-search/ged-search.component';
import { GedConservationComponent } from './pages/ged-conservation/ged-conservation.component';
import { GedDossiersVirtuelsComponent } from './pages/ged-dossiers-virtuels/ged-dossiers-virtuels.component';
import { GedBatchUploadComponent } from './pages/ged-batch-upload/ged-batch-upload.component';
import { PermissionsGedComponent } from './permissions/permissions-ged.component';
import { ProcessusListComponent } from './processus/processus-list.component';
import { ProcessusFormComponent } from './processus/processus-form.component';
import { StorageConfigComponent } from './storage-config/storage-config.component';
import { FolderTreeItemComponent } from './components/folder-tree-item/folder-tree-item.component';

@NgModule({
  declarations: [
    GedCourrierComponent,
    GedMergeComponent,
    GedCatalogComponent,
    GedDocumentPageComponent,
    GedArchivesComponent,
    GedDisposalComponent,
    GedSearchComponent,
    GedConservationComponent,
    GedDossiersVirtuelsComponent,
    GedBatchUploadComponent,
    PermissionsGedComponent,
    ProcessusListComponent,
    ProcessusFormComponent,
    StorageConfigComponent,
    FolderTreeItemComponent
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

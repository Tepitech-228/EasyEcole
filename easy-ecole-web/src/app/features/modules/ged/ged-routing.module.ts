import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GedCourrierComponent } from './pages/ged-courrier/ged-courrier.component';
import { GedMergeComponent } from './pages/ged-merge/ged-merge.component';
import { GedCatalogComponent } from './pages/ged-catalog/ged-catalog.component';
import { GedSearchComponent } from './pages/ged-search/ged-search.component';
import { GedConservationComponent } from './pages/ged-conservation/ged-conservation.component';
import { GedDossiersVirtuelsComponent } from './pages/ged-dossiers-virtuels/ged-dossiers-virtuels.component';
import { GedDocumentPageComponent } from './pages/ged-document-page/ged-document-page.component';
import { GedArchivesComponent } from './pages/ged-archives/ged-archives.component';
import { GedDisposalComponent } from './pages/ged-disposal/ged-disposal.component';
import { GedBatchUploadComponent } from './pages/ged-batch-upload/ged-batch-upload.component';
import { PermissionsGedComponent } from './permissions/permissions-ged.component';
import { ProcessusListComponent } from './processus/processus-list.component';
import { ProcessusFormComponent } from './processus/processus-form.component';
import { StorageConfigComponent } from './storage-config/storage-config.component';

const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'courrier', component: GedCourrierComponent },
  { path: 'upload', component: GedMergeComponent },
  { path: 'folders', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'nomenclature', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'catalog', component: GedCatalogComponent },
  { path: 'search', component: GedSearchComponent },
  { path: 'conservation', component: GedConservationComponent },
  { path: 'dossiers-virtuels', component: GedDossiersVirtuelsComponent },
  { path: 'document/:id', component: GedDocumentPageComponent },
  { path: 'archives', component: GedArchivesComponent },
  { path: 'sessions', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'disposal', component: GedDisposalComponent },
  { path: 'permissions', component: PermissionsGedComponent },
  { path: 'processus', component: ProcessusListComponent },
  { path: 'processus/new', component: ProcessusFormComponent },
  { path: 'processus/:id/edit', component: ProcessusFormComponent },
  { path: 'import', component: GedBatchUploadComponent },
  { path: 'storage-config', component: StorageConfigComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GedRoutingModule { }

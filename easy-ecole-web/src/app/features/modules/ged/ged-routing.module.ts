import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GedPageComponent } from './pages/ged-page/ged-page.component';
import { GedUploadComponent } from './pages/ged-upload/ged-upload.component';
import { GedNomenclatureComponent } from './pages/ged-nomenclature/ged-nomenclature.component';
import { GedCatalogComponent } from './pages/ged-catalog/ged-catalog.component';
import { GedDocumentPageComponent } from './pages/ged-document-page/ged-document-page.component';
import { GedFoldersComponent } from './pages/ged-folders/ged-folders.component';
import { GedSessionsPageComponent } from './pages/ged-sessions/ged-sessions-page.component';
import { GedSessionDetailPageComponent } from './pages/ged-sessions/ged-session-detail-page.component';

const routes: Routes = [
  {
    path: '',
    component: GedPageComponent,
    children: [
      { path: '', redirectTo: 'catalog', pathMatch: 'full' },
      { path: 'upload', component: GedUploadComponent },
      { path: 'nomenclature', component: GedNomenclatureComponent },
      { path: 'catalog', component: GedCatalogComponent },
      { path: 'document/:id', component: GedDocumentPageComponent },
      { path: 'folders', component: GedFoldersComponent },
      { path: 'sessions', component: GedSessionsPageComponent },
      { path: 'sessions/:id', component: GedSessionDetailPageComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GedRoutingModule { }

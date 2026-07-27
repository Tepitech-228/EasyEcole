import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateDocumentPageComponent } from './pages/generate-document-page/generate-document-page.component';
import { TemplatesPageComponent } from './pages/templates-page/templates-page.component';
import { SignaturesDirectionPageComponent } from './pages/signatures-direction-page/signatures-direction-page.component';
import { TemplateEditPageComponent } from './pages/template-edit-page/template-edit-page.component';
import { DocumentsPageComponent } from './pages/documents-page/documents-page.component';
import { CachetPageComponent } from './pages/cachet-page/cachet-page.component';
import { WorkflowsPageComponent } from './pages/workflows-page/workflows-page.component';
import { SignaturesPageComponent } from './pages/signatures-page/signatures-page.component';
import { TypesPageComponent } from './pages/types-page/types-page.component';

const routes: Routes = [
  { path: 'types', component: TypesPageComponent },
  { path: 'types/:id', component: TypesPageComponent },
  { path: 'templates', component: TemplatesPageComponent },
  { path: 'templates/:id', component: TemplateEditPageComponent },
  { path: 'templates/new/:typeId', component: TemplateEditPageComponent },
  { path: 'documents', component: DocumentsPageComponent },
  { path: 'cachet', component: CachetPageComponent },
  { path: 'workflows', component: WorkflowsPageComponent },
  { path: 'workflows/:typeId', component: WorkflowsPageComponent },
  { path: 'signatures', component: SignaturesPageComponent },
  { path: 'signatures/direction', component: SignaturesDirectionPageComponent },
  { path: 'generer', component: GenerateDocumentPageComponent },
  { path: '', redirectTo: 'documents', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocgenRoutingModule { }

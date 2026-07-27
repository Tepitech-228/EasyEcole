import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocgenRoutingModule } from './docgen-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TypesPageComponent } from './pages/types-page/types-page.component';
import { TemplatesPageComponent } from './pages/templates-page/templates-page.component';
import { TemplateEditPageComponent } from './pages/template-edit-page/template-edit-page.component';
import { DocumentsPageComponent } from './pages/documents-page/documents-page.component';
import { CachetPageComponent } from './pages/cachet-page/cachet-page.component';
import { WorkflowsPageComponent } from './pages/workflows-page/workflows-page.component';
import { SignaturesPageComponent } from './pages/signatures-page/signatures-page.component';
import { SignaturesDirectionPageComponent } from './pages/signatures-direction-page/signatures-direction-page.component';
import { GenerateDocumentPageComponent } from './pages/generate-document-page/generate-document-page.component';

@NgModule({
  declarations: [
    TypesPageComponent,
    TemplatesPageComponent,
    TemplateEditPageComponent,
    DocumentsPageComponent,
    CachetPageComponent,
    WorkflowsPageComponent,
    SignaturesPageComponent,
    SignaturesDirectionPageComponent,
    GenerateDocumentPageComponent,
  ],
  imports: [
    CommonModule,
    DocgenRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class DocgenModule { }

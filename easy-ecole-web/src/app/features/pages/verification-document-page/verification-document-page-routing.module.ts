import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationDocumentPageComponent } from './verification-document-page.component';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [
  { path: '', component: VerificationDocumentPageComponent },
  { path: 'document/:matricule/:reference', component: VerificationDocumentPageComponent }
];

@NgModule({
  declarations: [VerificationDocumentPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class VerificationRoutingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ParentDashboardComponent } from './pages/parent-dashboard/parent-dashboard.component';
import { ParentNotesComponent } from './pages/parent-notes/parent-notes.component';
import { ParentAbsencesComponent } from './pages/parent-absences/parent-absences.component';
import { ParentEdtComponent } from './pages/parent-edt/parent-edt.component';
import { ParentPaiementsComponent } from './pages/parent-paiements/parent-paiements.component';
import { ParentDocumentsComponent } from './pages/parent-documents/parent-documents.component';
import { ParentRoutingModule } from './parent-routing.module';

@NgModule({
  declarations: [
    ParentDashboardComponent,
    ParentNotesComponent,
    ParentAbsencesComponent,
    ParentEdtComponent,
    ParentPaiementsComponent,
    ParentDocumentsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ParentRoutingModule,
  ]
})
export class ParentModule { }
